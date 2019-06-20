// const PreventPublicRepos = require('./lib/PreventPublicRepos')

module.exports = (robot, _, PreventPublicRepos = require('./lib/PreventPublicRepos')) => {
  robot.on('repository.created', async context => {
    return PreventPublicRepos.analyze(context.github, context.repo(), context.payload, robot.log)
      .catch((error) => {
        robot.log.error(error)
      })
  })

  robot.on('repository.publicized', async context => {
    robot.log('New repo was publicized')
    return PreventPublicRepos.analyze(context.github, context.repo(), context.payload, robot.log)
      .catch((error) => {
        robot.log.error(error)
      })
  })
}
