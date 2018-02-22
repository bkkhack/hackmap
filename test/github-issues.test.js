const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const axiosMock = () => {
  return new MockAdapter(axios)
}

import auth from '../src/github-oauth.js'
import GitHubIssueService from '../src/github-issues.js'

jest.mock('../src/github-oauth.js', () => {
  return {
    isLoggedIn: jest.fn(),
    logOut: jest.fn(),
    getOAuthToken: jest.fn()
  }
})


let validConfig = () => {
  return {
    issueNumber: 1,
    onHelpText: () => {},
    organization: 'bkkhack',
    repository: 'hackmap',
    label: 'BKKHack Main Thread',
    pollIntervalSeconds: 1,
    onAuthenticationRequired: () => {},
    onProjectsUpdated: () => {},
    onError: (error) => {},
    onInit: () => {}
  }
}

let instance = (config) => {
  return new GitHubIssueService(config)
}

const issuesURL = 'issues'
const mainThreadURL = /issues\/\d+\/comments/

let mockGetIssues = (mock) => {
  mock.onGet(issuesURL).reply(function(config) {
    return [200, [{ number: 1 }]]
  })
}

let mockGetMainThread = (mock) => {
  mock.onGet(mainThreadURL).reply(function(config) {
    return [200, [], { etag: '12345' }]
  })
}

describe('GitHubIssueService', () => {
  describe('.config', () => {
    describe('.onError callback will be fired when something went wrong with', () => {
      it('issues API request', (done) => {
        let mock = axiosMock()
        mockGetMainThread(mock)
        mock.onGet(issuesURL).reply(function(config) {
          return [404]
        })

        let cfg = validConfig()
        cfg.onError = (error) => {
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toEqual('Unable get issues data')
          done()
        }
        instance(cfg)
      })

      it('ideas API request', (done) => {
        let mock = axiosMock()
        mockGetIssues(mock)
        mock.onGet(mainThreadURL).networkError()

        let cfg = validConfig()
        cfg.onError = (error) => {
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toEqual('Failed retrieving ideas')
          done()
        }
        instance(cfg)
      })
    })
  })

  describe('.onHelpText callback ', () => {
    it('will be fired when main issue found', (done) => {
      let expectedIssue = { number: 1, body: 'hello' }

      let mock = axiosMock()
      mock.onGet(issuesURL).reply(function(config) {
        return [200, [expectedIssue]]
      })
      mockGetMainThread(mock)

      let cfg = validConfig()
      cfg.onHelpText = (msg) => {
        expect(msg).toEqual(expectedIssue.body)
        done()
      }
      instance(cfg)
    })
  })

  describe('.onInit callback ', () => {
    it('will be fired when starting the service', (done) => {
      let cfg = validConfig()
      cfg.onInit = () => {
        done()
      }
      instance(cfg)
    })
  })
})

