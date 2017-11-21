const PreventPublicRepos = require('./lib/PreventPublicRepos')

module.exports = (robot) => {
  robot.on('repository.created', async context => {
    // Code was pushed to the repo, what should we do with it?
    //robot.log(context);

    const privatize_repo =  (process.env.PRIVATIZE_REPO && process.env.PRIVATIZE_REPO.toLowerCase() == "true") ? true : false
    robot.log('Privatize Repo: ' + privatize_repo);

    return PreventPublicRepos.sync(context.github, context.repo(), context.payload);
  });

  robot.on('repository.publicized', async context => {
    // Code was pushed to the repo, what should we do with it?
    robot.log("New repo was publicized");
  });
}
