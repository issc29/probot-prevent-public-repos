const {createRobot} = require('probot')
const plugin = require('../index')

describe('plugin', () => {
  let robot
  let event
  let analyze

  beforeEach(() => {
    robot = createRobot()
    robot.auth = () => Promise.resolve({})

    event = {
      event: 'repository',
      payload: JSON.parse(JSON.stringify(require('./events/repo.create.json')))
    }
    analyze = jest.fn()

    plugin(robot, {}, {analyze})
  })

  describe('analyzes on created repo', () => {
    it('analyzes repo', async () => {
      await robot.receive(event)
      expect(analyze).toHaveBeenCalled()
    })
  })
})
