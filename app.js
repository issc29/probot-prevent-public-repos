
/**
 * @param {import('probot').Probot} app
 */

module.exports = (app, _, PreventPublicRepos = require('./lib/PreventPublicRepos')) => {
  app.on('repository.created', async context => {
    return PreventPublicRepos.analyze(context.octokit, context.repo(), context.payload, app.log)
      .catch((error) => {
        app.log.error(error)
      })
  })

  app.on('repository.publicized', async context => {
    app.log('New repo was publicized')
    return PreventPublicRepos.analyze(context.octokit, context.repo(), context.payload, app.log)
      .catch((error) => {
        app.log.error(error)
      })
  })
}
