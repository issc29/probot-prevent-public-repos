const PreventPublicRepos = require('../lib/PreventPublicRepos')

describe('PreventPublicRepos', () => {
  let github
  let robot

  function configure (payload, yaml) {
    return new PreventPublicRepos(github, {owner: 'issc29-GHfB', repo: 'test-pro'}, payload, console, yaml)
  }

  beforeEach(() => {
    github = {
      repos: {
        edit: jest.fn().mockImplementation(() => Promise.resolve()),
        getContent: jest.fn().mockImplementation(() => Promise.resolve())
      },
      issues: {
        create: jest.fn().mockImplementation(() => Promise.resolve([]))
      }
    }

    payloadPublicizied = {
      action: 'publicized',
      repository: {
        private: false
      },
      sender: {
        login: 'issc29'
      }
    }
    payloadCreatedPublic = {
      action: 'created',
      repository: {
        private: false
      },
      sender: {
        login: 'issc29'
      }
    }
    payloadCreatedPrivate = {
      action: 'created',
      repository: {
        private: true
      },
      sender: {
        login: 'issc29'
      }
    }
  })

  describe('update', () => {
    beforeEach(() => {
      spyExecutePrivatize = jest.spyOn(PreventPublicRepos.prototype, 'executePrivatize')
      spyMonitorOnly = jest.spyOn(PreventPublicRepos.prototype, 'executeMonitorOnly')
    })
    afterEach(function () {
      spyExecutePrivatize.mockClear()
      spyMonitorOnly.mockClear()
    })

    it('publicizied and privateToPublic Disabled', () => {
      const config = configure(payloadPublicizied, `
        enablePrivateToPublic: false
      `)
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).not.toHaveBeenCalled()
    })

    it('publicizied and privateToPublic Enabled', () => {
      const config = configure(payloadPublicizied, `
        monitorOnly: true
        enablePrivateToPublic: true
      `)
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).toHaveBeenCalled()
    })

    it('created and privateToPublic Diabled', () => {
      const config = configure(payloadCreatedPublic, `
        monitorOnly: true
        enablePrivateToPublic: false
      `)
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).toHaveBeenCalled()
    })

    it('created and privateToPublic Enabled', () => {
      const config = configure(payloadCreatedPublic, `
        monitorOnly: true
        enablePrivateToPublic: true
      `)
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).toHaveBeenCalled()
    })

    it('created and is excluded Repo', () => {
      const config = configure(payloadCreatedPublic, `
        excludeRepos: ['test-pro1', 'test-pro']
      `)
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).not.toHaveBeenCalled()
    })

    it('created and is not excluded Repo', () => {
      const config = configure(payloadCreatedPublic, `
        monitorOnly: true
        excludeRepos: ['test-pro2', test-pro3]
      `)
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).toHaveBeenCalled()
    })

    it('created private', () => {
      const config = configure(payloadCreatedPrivate, ``)
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).not.toHaveBeenCalled()
    })

    it('created public and monitorOnly mode', () => {
      const config = configure(payloadCreatedPublic, `
        monitorOnly: true
        monitorIssueTitle: 'blah '
      `)
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).toHaveBeenCalled()
    })

    it('created public and monitorOnly mode disabled', () => {
      const config = configure(payloadCreatedPublic, `
        monitorOnly: false
      `)
      config.update()
      expect(spyExecutePrivatize).toHaveBeenCalled()
      expect(spyMonitorOnly).not.toHaveBeenCalled()
    })
  })

  describe('formIssueBody', () => {
    it('formIssueBody with ccList', () => {
      const config = configure(payloadCreatedPublic, `
        ccList: "@security"
      `)
      var issueBody = config.formIssueBody('test123', '@security')
      expect(issueBody).toEqual('test123\n\n/cc @issc29\n/cc @security')
    })

    it('formIssueBody with no ccList', () => {
      const config = configure(payloadCreatedPublic, ``)
      var issueBody = config.formIssueBody('test123', '')
      expect(issueBody).toEqual('test123\n\n/cc @issc29')
    })
  })

  describe('createIssue', () => {
    it('creatIssue with Title and Body', () => {
      const config = configure(payloadCreatedPublic, ``)
      config.createIssue('TitleTest', 'BodyTest')
      expect(github.issues.create).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        title: 'TitleTest',
        body: 'BodyTest'
      })
    })
  })

  describe('changeVisibility', () => {
    it('changeVisibility of repo', () => {
      const config = configure(payloadCreatedPublic, ``)
      config.changeVisibility()
      expect(github.repos.edit).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        private: true,
        name: 'test-pro'
      })
    })
  })

  describe('executeMonitorOnly', () => {
    it('executeMonitorOnly', () => {
      var spyFormIssueBody = jest.spyOn(PreventPublicRepos.prototype, 'formIssueBody')
      var spyCreateIssue = jest.spyOn(PreventPublicRepos.prototype, 'createIssue')
      const config = configure(payloadCreatedPublic, `
        monitorIssueBody: "MonitorIssueBodyText"
        ccList: "@security"
        `)
      config.executeMonitorOnly({
        monitorIssueTitle: 'MonitorIssueTitleText',
        monitorIssueBody: 'MonitorIssueBodyText',
        ccList: '@security'
      })
      expect(spyFormIssueBody).toHaveBeenCalledWith('MonitorIssueBodyText', '@security')
      expect(spyCreateIssue).toHaveBeenCalled()
    })
  })

  describe('executePrivatize', () => {
    it('executePrivatize', () => {
      var spyFormIssueBody = jest.spyOn(PreventPublicRepos.prototype, 'formIssueBody')
      var spyCreateIssue = jest.spyOn(PreventPublicRepos.prototype, 'createIssue')
      var spyChangeVisibility = jest.spyOn(PreventPublicRepos.prototype, 'changeVisibility')
      const config = configure(payloadCreatedPublic, `
        monitorIssueBody: "MonitorIssueBodyText"
        ccList: "@security"
        `)
      config.executePrivatize({
        monitorIssueTitle: 'MonitorIssueTitleText',
        monitorIssueBody: 'MonitorIssueBodyText',
        ccList: '@security'
      })
      expect(spyFormIssueBody).toHaveBeenCalledWith('MonitorIssueBodyText', '@security')
      expect(spyCreateIssue).toHaveBeenCalled()
      expect(spyChangeVisibility).toHaveBeenCalled()
    })
  })
})
