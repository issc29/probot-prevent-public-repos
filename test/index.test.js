const { createRobot } = require('probot')
const plugin = require('../index')

describe('plugin', () => {
  let robot
  let event
  let analyze

  beforeEach(() => {
    robot = createRobot()
    robot.auth = () => Promise.resolve({})

    analyze = jest.fn().mockImplementation(() => Promise.resolve())

    plugin(robot, {}, { analyze })
  })

  describe('analyzes on created repo', () => {
    beforeEach(() => {
      event = {
        event: 'repository',
        payload: JSON.parse(JSON.stringify(require('./events/repo.create.json')))
      }
    })

    it('analyzes repo', async () => {
      await robot.receive(event)
      expect(analyze).toHaveBeenCalled()
    })
  })

  describe('analyzes on publicizied repo', () => {
    beforeEach(() => {
      event = {
        event: 'repository',
        payload: JSON.parse(JSON.stringify(require('./events/repo.publicizied.json')))
      }
    })

    it('analyzes repo', async () => {
      await robot.receive(event)
      expect(analyze).toHaveBeenCalled()
    })
  })

  describe('does not analyze privatized repo', () => {
    beforeEach(() => {
      event = {
        event: 'repository',
        payload: JSON.parse(JSON.stringify(require('./events/repo.privatized.json')))
      }
    })

    it('does not analyze repo', async () => {
      await robot.receive(event)
      expect(analyze).not.toHaveBeenCalled()
    })
  })

  describe('catches any errors on analyze', () => {
    beforeEach(() => {
      robot = createRobot()
      robot.auth = () => Promise.resolve({})
      analyze = jest.fn().mockImplementation(() => Promise.reject(new Error('Bad yaml syntax')))

      plugin(robot, {}, { analyze })
    })

    it('catches created repo errors', async () => {
      event = {
        event: 'repository',
        payload: JSON.parse(JSON.stringify(require('./events/repo.create.json')))
      }
      var spyLogError = jest.spyOn(robot.log, 'error')

      await robot.receive(event)
      expect(spyLogError).toHaveBeenCalled()
    })

    it('catches publicized repo errors', async () => {
      event = {
        event: 'repository',
        payload: JSON.parse(JSON.stringify(require('./events/repo.publicizied.json')))
      }
      var spyLogError = jest.spyOn(robot.log, 'error')

      await robot.receive(event)
      expect(spyLogError).toHaveBeenCalled()
    })
  })
})
