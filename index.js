const PreventPublicRepos = require('./lib/PreventPublicRepos')

module.exports = (robot) => {
  robot.on('repository.created', async context => {
    // Code was pushed to the repo, what should we do with it?
    //robot.log(context);

    const privatize_repo =  (process.env.PRIVATIZE_REPO && process.env.PRIVATIZE_REPO.toLowerCase() == "true") ? true : false
    robot.log('Privatize Repo: ' + privatize_repo);

    return PreventPublicRepos.sync(context.github, context.repo(), context.payload);
    /*
    if(!payload.repository.private) {
      robot.log("Repo Public")

      if(privatize_repo) {
        robot.log("Making Repo Private")

        const repoName = context.repo().repo
        const owner = payload.sender.login
        const params = context.repo({title: '[CRITICAL] Public Repos Disabled', body: 'NOTE: Public Repos are disabled for this organization! Repository was automatically converted to a Private Repo.\n\n/cc @' + owner})
        context.github.issues.create(params);

        robot.log(repoName)
        const toPrivateParams = context.repo({private: true, name: repoName})
        context.github.repos.edit(toPrivateParams);
      }
      else {
        const repoName = context.repo().repo
        const owner = payload.sender.login
        const params = context.repo({title: '[CRITICAL] Public Repository Created', body: 'Please note that this repository is publicly visible to the internet!\n\n/cc @' + owner})
        context.github.issues.create(params);
      }
    }
    */
  });

  robot.on('repository.publicized', async context => {
    // Code was pushed to the repo, what should we do with it?
    robot.log("New repo was publicized");
  });
}
