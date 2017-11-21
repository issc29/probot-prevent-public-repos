const yaml = require('js-yaml')
const noOrgConfig = false


class PreventPublicRepos {
  static sync (github, repo, payload) {
    const defaults = require('./defaults')
    const orgRepo = (process.env.ORG_WIDE_REPO_NAME) ? process.env.ORG_WIDE_REPO_NAME : defaults.ORG_WIDE_REPO_NAME
    const filename = (process.env.FILE_NAME) ? process.env.FILE_NAME : defaults.FILE_NAME
    console.log("repo.owner: " + repo.owner + " repo: " + orgRepo + " path: " + filename)

    return github.repos.getContent({
      owner: repo.owner,
      repo: orgRepo,
      path: filename
    }).catch(() => ({ noOrgConfig }))
    .then((orgConfig) => {
      if ('noOrgConfig' in orgConfig) {
        return new PreventPublicRepos(github, repo, payload, '').update()
      } else {
        console.log('INFO', 'Organization configuration found')
        /*
        console.log('orgConfig:')
        console.log(orgConfig)
        console.log('orgConfig.data:')
        console.log(orgConfig.data)
        console.log('orgConfig.data.content:')
        console.log(orgConfig.data.content)
        */
        const content = Buffer.from(orgConfig.data.content, 'base64').toString()
        return new PreventPublicRepos(github, repo, payload, content).update()
      }


    })
  }


  constructor (github, repo, payload, config) {
    this.github = github
    this.repo = repo
    this.payload = payload
    this.config = yaml.safeLoad(config)
  }

  update () {
    var configParams = Object.assign({}, require('./defaults'), this.config || {})
    console.log(configParams);

    if(this.payload.action == "publicized" && !configParams.enablePrivateToPublic) {
      console.log("Repo: " + this.repo.repo + " was publicized but enablePrivateToPublic is set to false")
      return
    }

    if (configParams.excludeRepos.includes(this.repo.repo)){
      console.log("Repo: " + this.repo.repo + " is part of the exclusion list")
      return
    }

    if(!this.payload.repository.private) {
      console.log("Repo Public")
      const owner = this.payload.sender.login
      var ccUsers = ""

      if(configParams.privatizeRepo) {
        console.log("Making Repo Private")

        const repoName = this.repo.repo
        var issueBody = configParams.privatizedIssueBody + '\n\n/cc @' + owner
            issueBody += (configParams.ccList) ? '\n/cc ' + configParams.ccList : ''
        const issueParams = {title: configParams.privatizedIssueTitle, body: issueBody}
        const createIssueParams = Object.assign({}, this.repo, issueParams || {})
        this.github.issues.create(createIssueParams);

        console.log(repoName)
        const editParams = {private: true, name: repoName}
        const toPrivateParams = Object.assign({}, this.repo, editParams || {})
        this.github.repos.edit(toPrivateParams);
      }
      else {
        var issueBody = configParams.warningIssueBody + '\n\n/cc @' + owner
            issueBody += (configParams.ccList) ? '\n/cc ' + configParams.ccList : ''
        const issueParams = {title: configParams.warningIssueTitle, body: issueBody}
        const createIssueParams = Object.assign({}, this.repo, issueParams || {})
        this.github.issues.create(createIssueParams);
      }
    }
  }
}


module.exports = PreventPublicRepos
