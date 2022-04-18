const myProbotApp = require('../app')
const { Probot, ProbotOctokit } = require('probot')

describe('plugin', () => {
  let probot
  let event
  let analyze

  beforeEach(() => {
    analyze = jest.fn().mockImplementation(() => Promise.resolve())

    probot = new Probot({
      githubToken: 'test',
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false }
      })
    })
    myProbotApp(probot, {}, { analyze })
  })

  describe('analyzes on created repo', () => {
    beforeEach(() => {
      event = {
        name: 'repository',
        payload: JSON.parse(JSON.stringify(require('./events/repo.create.json')))
      }
    })

    it('analyzes repo', async () => {
      await probot.receive(event)
      expect(analyze).toHaveBeenCalled()
    })
  })

  describe('analyzes on publicizied repo', () => {
    beforeEach(() => {
      event = {
        name: 'repository',
        payload: JSON.parse(JSON.stringify(require('./events/repo.publicizied.json')))
      }
    })

    it('analyzes repo', async () => {
      await probot.receive(event)
      expect(analyze).toHaveBeenCalled()
    })
  })

  describe('does not analyze privatized repo', () => {
    beforeEach(() => {
      event = {
        name: 'repository',
        payload: JSON.parse(JSON.stringify(require('./events/repo.privatized.json')))
      }
    })

    it('does not analyze repo', async () => {
      await probot.receive(event)
      expect(analyze).not.toHaveBeenCalled()
    })
  })

  describe('catches any errors on analyze', () => {
    beforeEach(() => {
      analyze = jest.fn().mockImplementation(() => Promise.reject(new Error('Bad yaml syntax')))

      probot = new Probot({
        githubToken: 'test',
        Octokit: ProbotOctokit.defaults({
          retry: { enabled: false },
          throttle: { enabled: false }
        })
      })
      myProbotApp(probot, {}, { analyze })
    })

    it('catches created repo errors', async () => {
      event = {
        name: 'repository',
        payload: JSON.parse(JSON.stringify(require('./events/repo.create.json')))
      }
      var spyLogError = jest.spyOn(probot.log, 'error')

      await probot.receive(event)
      expect(spyLogError).toHaveBeenCalled()
    })

    it('catches publicized repo errors', async () => {
      event = {
        name: 'repository',
        payload: JSON.parse(JSON.stringify(require('./events/repo.publicizied.json')))
      }
      var spyLogError = jest.spyOn(probot.log, 'error')

      await probot.receive(event)
      expect(spyLogError).toHaveBeenCalled()
    })
  })
})
