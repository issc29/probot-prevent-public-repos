const yaml = require('js-yaml')
const noOrgConfig = false

class PreventPublicRepos {
  static analyze (github, repo, payload, logger) {
    const defaults = require('./defaults')
    const orgRepo = (process.env.ORG_WIDE_REPO_NAME) ? process.env.ORG_WIDE_REPO_NAME : defaults.ORG_WIDE_REPO_NAME
    const filename = (process.env.FILE_NAME) ? process.env.FILE_NAME : defaults.FILE_NAME
    logger.debug('Get config from: ' + repo.owner + '/' + orgRepo + '/' + filename)

    return github.repos.getContent({
      owner: repo.owner,
      repo: orgRepo,
      path: filename
    }).catch(() => ({
      noOrgConfig
    }))
      .then((orgConfig) => {
        if ('noOrgConfig' in orgConfig) {
          logger.log('NOTE: config file not found in: ' + orgRepo + '/' + filename + ', using defaults.')
          return new PreventPublicRepos(github, repo, payload, logger, '').update()
        } else {
          const content = Buffer.from(orgConfig.data.content, 'base64').toString()
          return new PreventPublicRepos(github, repo, payload, logger, content).update()
        }
      })
  }

  constructor (github, repo, payload, logger, config) {
    this.github = github
    this.repo = repo
    this.payload = payload
    this.logger = logger
    this.config = yaml.safeLoad(config)
  }

  update () {
    var configParams = Object.assign({}, require('./defaults'), this.config || {})

    if (this.payload.action === 'publicized' && !configParams.enablePrivateToPublic) {
      this.logger.debug('Repo: ' + this.repo.repo + ' was publicized but enablePrivateToPublic is set to false')
      return
    }

    if (configParams.excludeRepos.includes(this.repo.repo)) {
      this.logger.debug('Repo: ' + this.repo.repo + ' is part of the exclusion list')
      return
    }

    if (this.payload.repository.private) {
      this.logger.debug('Repo: ' + this.repo.repo + ' is private')
      return
    }

    this.logger.debug('Repo: ' + this.repo.repo + ' is private')
    if (!configParams.monitorOnly) {
      return this.executePrivatize(configParams)
    }

    return this.executeMonitorOnly(configParams)
  }

  executePrivatize (configParams) {
    this.logger.debug('Privatizing Repo: ' + this.repo.repo)

    var issueBody = this.formIssueBody(configParams.privatizedIssueBody, configParams.ccList)
    this.createIssue(configParams.privatizedIssueTitle, issueBody)
    this.changeVisibility()
  }

  executeMonitorOnly (configParams) {
    var issueBody = this.formIssueBody(configParams.monitorIssueBody, configParams.ccList)
    this.createIssue(configParams.monitorIssueTitle, issueBody)
  }

  formIssueBody (body, ccList) {
    const owner = this.payload.sender.login
    var issueBody = body + '\n\n/cc @' + owner
    issueBody += (ccList) ? '\n/cc ' + ccList : ''
    return issueBody
  }

  createIssue (title, body) {
    const issueParams = {
      title: title,
      body: body
    }
    const createIssueParams = Object.assign({}, this.repo, issueParams || {})
    this.github.issues.create(createIssueParams)
  }

  changeVisibility () {
    const editParams = {
      private: true,
      name: this.repo.repo
    }
    const toPrivateParams = Object.assign({}, this.repo, editParams || {})
    this.github.repos.edit(toPrivateParams)
  }
}

module.exports = PreventPublicRepos
