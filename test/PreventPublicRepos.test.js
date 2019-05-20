const PreventPublicRepos = require('../lib/PreventPublicRepos')
const yaml = require('js-yaml')

describe('PreventPublicRepos', () => {
  let github
  let payloadPublicized
  let payloadCreatedPublic
  let payloadCreatedPrivate

  function configure (payload, yaml) {
    return new PreventPublicRepos(github, { owner: 'issc29-GHfB', repo: 'test-pro' }, payload, console, yaml)
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

    payloadPublicized = {
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
    let spyExecutePrivatize
    let spyMonitorOnly
    beforeEach(() => {
      spyExecutePrivatize = jest.spyOn(PreventPublicRepos.prototype, 'executePrivatize')
      spyMonitorOnly = jest.spyOn(PreventPublicRepos.prototype, 'executeMonitorOnly')
    })
    afterEach(function () {
      spyExecutePrivatize.mockClear()
      spyMonitorOnly.mockClear()
    })

    it('publicizied and privateToPublic Disabled', () => {
      const config = configure(payloadPublicized, yaml.safeLoad(`
        enablePrivateToPublic: false
      `))
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).not.toHaveBeenCalled()
    })

    it('publicizied and privateToPublic Enabled', () => {
      const config = configure(payloadPublicized, yaml.safeLoad(`
        monitorOnly: true
        enablePrivateToPublic: true
      `))
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).toHaveBeenCalled()
      expect(github.issues.create).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        title: '[CRITICAL] Public Repositories are visible to all users',
        body: 'Please note that this repository is publicly visible to all users!\n\n/cc @issc29'
      })
    })

    it('created and privateToPublic Diabled', () => {
      const config = configure(payloadCreatedPublic, yaml.safeLoad(`
        monitorOnly: true
        enablePrivateToPublic: false
      `))
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).toHaveBeenCalled()
      expect(github.issues.create).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        title: '[CRITICAL] Public Repositories are visible to all users',
        body: 'Please note that this repository is publicly visible to all users!\n\n/cc @issc29'
      })
    })

    it('created and privateToPublic Enabled', () => {
      const config = configure(payloadCreatedPublic, yaml.safeLoad(`
        monitorOnly: true
        enablePrivateToPublic: true
      `))
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).toHaveBeenCalled()
      expect(github.issues.create).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        title: '[CRITICAL] Public Repositories are visible to all users',
        body: 'Please note that this repository is publicly visible to all users!\n\n/cc @issc29'
      })
    })

    it('created and is excluded Repo', () => {
      const config = configure(payloadCreatedPublic, yaml.safeLoad(`
        excludeRepos: ['test-pro1', 'test-pro']
      `))
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).not.toHaveBeenCalled()
    })

    it('created and is not excluded Repo', () => {
      const config = configure(payloadCreatedPublic, yaml.safeLoad(`
        monitorOnly: true
        excludeRepos: ['test-pro2', test-pro3]
      `))
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).toHaveBeenCalled()
      expect(github.issues.create).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        title: '[CRITICAL] Public Repositories are visible to all users',
        body: 'Please note that this repository is publicly visible to all users!\n\n/cc @issc29'
      })
    })

    it('created private', () => {
      const config = configure(payloadCreatedPrivate, yaml.safeLoad(``))
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).not.toHaveBeenCalled()
    })

    it('created public with defaults', () => {
      const config = configure(payloadCreatedPublic, yaml.safeLoad(``))
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).toHaveBeenCalled()
      expect(github.issues.create).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        title: '[CRITICAL] Public Repositories are visible to all users',
        body: 'Please note that this repository is publicly visible to all users!\n\n/cc @issc29'
      })
    })

    it('created public and monitorOnly mode', () => {
      const config = configure(payloadCreatedPublic, yaml.safeLoad(`
        monitorOnly: true
        monitorIssueTitle: 'blah '
      `))
      config.update()
      expect(spyExecutePrivatize).not.toHaveBeenCalled()
      expect(spyMonitorOnly).toHaveBeenCalled()
      expect(github.issues.create).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        title: 'blah ',
        body: 'Please note that this repository is publicly visible to all users!\n\n/cc @issc29'
      })
    })

    it('created public and monitorOnly mode disabled', () => {
      const config = configure(payloadCreatedPublic, yaml.safeLoad(`
        monitorOnly: false
      `))
      config.update()
      expect(spyExecutePrivatize).toHaveBeenCalled()
      expect(spyMonitorOnly).not.toHaveBeenCalled()
      expect(github.issues.create).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        title: '[CRITICAL] Public Repositories are Disabled for this Org',
        body: 'NOTE: Public Repos are disabled for this organization! Repository was automatically converted to a Private Repo. Please contact an admin to override.\n\n/cc @issc29'
      })
      expect(github.repos.edit).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        private: true,
        name: 'test-pro'
      })
    })
  })

  describe('formIssueBody', () => {
    it('formIssueBody with ccList', () => {
      const config = configure(payloadCreatedPublic, yaml.safeLoad(`
        ccList: "@security"
      `))
      var issueBody = config.formIssueBody('test123', '@security')
      expect(issueBody).toEqual('test123\n\n/cc @issc29\n/cc @security')
    })

    it('formIssueBody with no ccList', () => {
      const config = configure(payloadCreatedPublic, yaml.safeLoad(``))
      var issueBody = config.formIssueBody('test123', '')
      expect(issueBody).toEqual('test123\n\n/cc @issc29')
    })
  })

  describe('createIssue', () => {
    it('creatIssue with Title and Body', () => {
      const config = configure(payloadCreatedPublic, yaml.safeLoad(``))
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
      const config = configure(payloadCreatedPublic, yaml.safeLoad(``))
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
      const config = configure(payloadCreatedPublic, yaml.safeLoad(`
        monitorIssueBody: "MonitorIssueBodyText"
        ccList: "@security"
        `))
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
      const config = configure(payloadCreatedPublic, yaml.safeLoad(`
        monitorIssueBody: "MonitorIssueBodyText"
        ccList: "@security"
        `))
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
