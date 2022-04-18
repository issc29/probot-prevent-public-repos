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
        update: jest.fn().mockImplementation(() => Promise.resolve())
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
      expect(github.repos.update).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        private: true
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
      expect(github.repos.update).toHaveBeenCalledWith({
        owner: 'issc29-GHfB',
        repo: 'test-pro',
        private: true
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

  describe('analyze', () => {
    it('analyze with valid content', () => {
      var contentValidFile = {
        data: {
          content: 'IyBDb25maWd1cmF0aW9uIGZvciBQcmV2ZW50LVB1YmxpYy1SZXBvcwoKIyBU\ndXJuIG9uIE1vbml0b3IgTW9kZS4gSW4gdGhpcyBtb2RlIHRoZSByZXBvIHZp\nc2liaWxpdHkgaXMgbm90IG1vZGlmaWVkIGFuZCBvbmx5IGFuIElzc3VlIGlz\nIGNyZWF0ZWQKbW9uaXRvck9ubHk6IHRydWUKCiMgRW5hYmxlcyBkZXRlY3Rp\nb24gb2YgcmVwb3MgdGhhdCBjaGFuZ2UgdmlzaWJpbGl0eSBmcm9tIHByaXZh\ndGUgdG8gcHVibGljIChub3QganVzdCBuZXdseSBjcmVhdGVkIG9uZXMpCmVu\nYWJsZVByaXZhdGVUb1B1YmxpYzogdHJ1ZQoKIyBJc3N1ZSBUaXRsZSB3aGVu\nIHJlcG8gaXMgcHJpdmF0aXplZApwcml2YXRpemVkSXNzdWVUaXRsZTogJ1tD\nUklUSUNBTF0gUHVibGljIFJlcG9zaXRvcmllcyBhcmUgRGlzYWJsZWQgZm9y\nIHRoaXMgT3JnJwoKIyBJc3N1ZSBCb2R5IHdoZW4gcmVwbyBpcyBwcml2YXRp\nemVkCnByaXZhdGl6ZWRJc3N1ZUJvZHk6ICdOT1RFOiBQdWJsaWMgUmVwb3Mg\nYXJlIGRpc2FibGVkIGZvciB0aGlzIG9yZ2FuaXphdGlvbiEgUmVwb3NpdG9y\neSB3YXMgYXV0b21hdGljYWxseSBjb252ZXJ0ZWQgdG8gYSBQcml2YXRlIFJl\ncG8uIFBsZWFzZSBjb250YWN0IGFuIGFkbWluIHRvIG92ZXJyaWRlLicKCiMg\nSXNzdWUgVGl0bGUgd2hlbiBtb25pdG9yIG1vZGUgaXMgZW5hYmxlZAptb25p\ndG9ySXNzdWVUaXRsZTogJ3Rlc3RUaXRsZScKCiMgSXNzdWUgQm9keSB3aGVu\nIG1vbml0b3IgbW9kZSBpcyBlbmFibGUKbW9uaXRvcklzc3VlQm9keTogJ1Bs\nZWFzZSBub3RlIHRoYXQgdGhpcyByZXBvc2l0b3J5IGlzIHB1YmxpY2x5IHZp\nc2libGUgdG8gdGhlIGludGVybmV0IScKCiMgVXNlcnMvR3JvdXBzIHRoYXQg\nc2hvdWxkIGJlIGNjJ2VkIG9uIHRoZSBpc3N1ZS4gU2hvdWxkIGJlIHVzZXJz\nL2dyb3VwcyBzZXBhcmF0ZWQgYnkgYSBzcGFjZS4KIyBjY0xpc3Q6ICdAaXNz\nYzI5JwoKIyBSZXBvcyB0byAgZXhjbHVkZSBpbiBkZXRlY3Rpb24uIFNob3Vs\nZCBiZSBhIExpc3Qgb2YgU3RyaW5ncy4KZXhjbHVkZVJlcG9zOiBbJ3JlcG8x\nJywgJ3JlcG8yJ10K\n'
        }
      }
      github.repos.getContent = jest.fn().mockImplementation(() => Promise.resolve(contentValidFile))

      var spyUpdate = jest.spyOn(PreventPublicRepos.prototype, 'update')
      var spyCreateIssue = jest.spyOn(PreventPublicRepos.prototype, 'createIssue')

      expect.assertions(3)
      return PreventPublicRepos.analyze(github, { owner: 'issc29-GHfB', repo: 'test-pro' }, payloadPublicized, console)
        .then((fulfilled) => {
          expect(spyUpdate).toHaveBeenCalled()
          expect(spyCreateIssue).toHaveBeenCalled()
          expect(github.issues.create).toHaveBeenCalledWith({
            owner: 'issc29-GHfB',
            repo: 'test-pro',
            title: 'testTitle',
            body: 'Please note that this repository is publicly visible to the internet!\n\n/cc @issc29'
          })
        })
    })

    it('analyze with failure to get content', () => {
      github.repos.getContent = jest.fn().mockImplementation(() => Promise.reject(new Error()))
      var spyUpdate = jest.spyOn(PreventPublicRepos.prototype, 'update')
      var spyCreateIssue = jest.spyOn(PreventPublicRepos.prototype, 'createIssue')

      expect.assertions(3)
      return PreventPublicRepos.analyze(github, { owner: 'issc29-GHfB', repo: 'test-pro' }, payloadPublicized, console)
        .then((fulfilled) => {
          expect(spyUpdate).toHaveBeenCalled()
          expect(spyCreateIssue).toHaveBeenCalled()
          expect(github.issues.create).toHaveBeenCalledWith({
            owner: 'issc29-GHfB',
            repo: 'test-pro',
            title: '[CRITICAL] Public Repositories are visible to all users',
            body: 'Please note that this repository is publicly visible to all users!\n\n/cc @issc29'
          })
        })
    })

    it('analyze with bad yaml content', () => {
      var contentInvalidFile = {
        data: {
          content: 'IyBDb25maWd1cmF0aW9uIGZvciBQcmV2ZW50LVB1YmxpYy1SZXBvcwoKIyBU\ndXJuIG9uIE1vbml0b3IgTW9kZS4gSW4gdGhpcyBtb2RlIHRoZSByZXBvIHZp\nc2liaWxpdHkgaXMgbm90IG1vZGlmaWVkIGFuZCBvbmx5IGFuIElzc3VlIGlz\nIGNyZWF0ZWQKbW9uaXRvck9ubHk6IHRydWUKCiMgRW5hYmxlcyBkZXRlY3Rp\nb24gb2YgcmVwb3MgdGhhdCBjaGFuZ2UgdmlzaWJpbGl0eSBmcm9tIHByaXZh\ndGUgdG8gcHVibGljIChub3QganVzdCBuZXdseSBjcmVhdGVkIG9uZXMpCmVu\nYWJsZVByaXZhdGVUb1B1YmxpYzogdHJ1ZQoKIyBJc3N1ZSBUaXRsZSB3aGVu\nIHJlcG8gaXMgcHJpdmF0aXplZApwcml2YXRpemVkSXNzdWVUaXRsZTogJ1tD\nUklUSUNBTF0gUHVibGljIFJlcG9zaXRvcmllcyBhcmUgRGlzYWJsZWQgZm9y\nIHRoaXMgT3JnJwoKIyBJc3N1ZSBCb2R5IHdoZW4gcmVwbyBpcyBwcml2YXRp\nemVkCnByaXZhdGl6ZWRJc3N1ZUJvZHk6ICdOT1RFOiBQdWJsaWMgUmVwb3Mg\nYXJlIGRpc2FibGVkIGZvciB0aGlzIG9yZ2FuaXphdGlvbiEgUmVwb3NpdG9y\neSB3YXMgYXV0b21hdGljYWxseSBjb252ZXJ0ZWQgdG8gYSBQcml2YXRlIFJl\ncG8uIFBsZWFzZSBjb250YWN0IGFuIGFkbWluIHRvIG92ZXJyaWRlLicKCiMg\nSXNzdWUgVGl0bGUgd2hlbiBtb25pdG9yIG1vZGUgaXMgZW5hYmxlZAptb25p\ndG9ySXNzdWVUaXRsZTogJ3Rlc3RUaXRsZScKCiMgSXNzdWUgQm9keSB3aGVu\nIG1vbml0b3IgbW9kZSBpcyBlbmFibGUKbW9uaXRvcklzc3VlQm9keTogJ1Bs\nZWFzZSBub3RlIHRoYXQgdGhpcyByZXBvc2l0b3J5IGlzIHB1YmxpY2x5IHZp\nc2libGUgdG8gdGhlIGludGVybmV0IQoKIyBVc2Vycy9Hcm91cHMgdGhhdCBz\naG91bGQgYmUgY2MnZWQgb24gdGhlIGlzc3VlLiBTaG91bGQgYmUgdXNlcnMv\nZ3JvdXBzIHNlcGFyYXRlZCBieSBhIHNwYWNlLgojIGNjTGlzdDogJ0Bpc3Nj\nMjknCgojIFJlcG9zIHRvICBleGNsdWRlIGluIGRldGVjdGlvbi4gU2hvdWxk\nIGJlIGEgTGlzdCBvZiBTdHJpbmdzLgpleGNsdWRlUmVwb3M6IFsncmVwbzEn\nLCAncmVwbzInXQo=\n'
        }
      }
      github.repos.getContent = jest.fn().mockImplementation(() => Promise.resolve(contentInvalidFile))

      expect.assertions(1)
      return PreventPublicRepos.analyze(github, { owner: 'issc29-GHfB', repo: 'test-pro' }, payloadPublicized, console)
        .then(undefined, (rejection) => {
          console.log(rejection)
          expect(rejection).toEqual(expect.objectContaining({ name: 'YAMLException' }))
        })
    })
  })
})
