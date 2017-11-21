const PreventPublicRepos = require('./lib/PreventPublicRepos')

module.exports = (robot) => {
  robot.on('repository.created', async context => {
    // Code was pushed to the repo, what should we do with it?
    //robot.log(context);

    //robot.log('Privatize Repo: ' + privatize_repo);

    return PreventPublicRepos.sync(context.github, context.repo(), context.payload);
  });

  robot.on('repository.publicized', async context => {
    // Code was pushed to the repo, what should we do with it?
    robot.log("New repo was publicized");
  });
}
