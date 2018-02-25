const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const axiosMock = () => {
  return new MockAdapter(axios)
}

jest.useFakeTimers();

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
    onMainThreadLoaded: () => {},
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
    return [200, [{ number: 1, body: 'hello <!-- floorplan: http://www.example.com -->'}]]
  })
}

let mockPollRequest = (mock) => {
  mock.onGet(mainThreadURL).reply(function(config) {
    return [200, [], { etag: '12345' }]
  })
}

function hideConsoleErrorFromTestRunner() {
  // hide ugly console.error output in test runner, because we're testing error behavior
  spyOn(console, 'error')
}

describe('GitHubIssueService', () => {
  describe('.config', () => {
    describe('.onError callback will be fired when something went wrong with', () => {
      it('issues API request', (done) => {
        hideConsoleErrorFromTestRunner()

        let mock = axiosMock()
        mockPollRequest(mock)
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

      it('polling API request', (done) => {
        hideConsoleErrorFromTestRunner()

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

  describe('.onMainThreadLoaded callback ', () => {
    it('will be fired when main issue found', (done) => {
      let githubIssue = {
        number: 1,
        title: 'title',
        body: 'hello <!-- floorplan: http://example.com -->'
      }
      let expectedThread = {
        number: 1,
        title: 'title',
        helpText: 'hello <!-- floorplan: http://example.com -->',
        floorplanUrl: 'http://example.com'
      }

      let mock = axiosMock()
      mock.onGet(issuesURL).reply(function(config) {
        return [200, [githubIssue]]
      })
      mockPollRequest(mock)

      let cfg = validConfig()
      cfg.onMainThreadLoaded = (mainThread) => {
        expect(mainThread.number).toEqual(expectedThread.number)
        expect(mainThread.title).toEqual(expectedThread.title)
        expect(mainThread.helpText).toEqual(expectedThread.helpText)
        expect(mainThread.floorplanUrl).toEqual(expectedThread.floorplanUrl)
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

