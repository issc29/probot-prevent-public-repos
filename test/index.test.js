const {createRobot} = require('probot')
const plugin = require('../index')

describe('plugin', () => {
  let robot
  let event
  let analyze

  beforeEach(() => {
    robot = createRobot()
    robot.auth = () => Promise.resolve({})

    analyze = jest.fn()

    plugin(robot, {}, {analyze})
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

    it('analyzes repo', async () => {
      await robot.receive(event)
      expect(analyze).not.toHaveBeenCalled()
    })
  })
})
