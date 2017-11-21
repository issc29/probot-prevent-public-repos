const PreventPublicRepos = require('./lib/PreventPublicRepos')

module.exports = (robot) => {
  robot.on('repository.created', async context => {
    return PreventPublicRepos.sync(context.github, context.repo(), context.payload);
  });

  robot.on('repository.publicized', async context => {
    robot.log("New repo was publicized");
    return PreventPublicRepos.sync(context.github, context.repo(), context.payload);
  });
}
