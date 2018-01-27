const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const mock = new MockAdapter(axios);

import GithubApiClient, { baseURL } from '../src/github-api-client.js'

describe('baseURL', () => {
  it('should equal github api base URL', () => {
    expect(baseURL).toBe('https://api.github.com/')
  })
})

let token = 'token'
let config = {
  organization: 'bkkhack',
  repository: 'hackmap',
}

describe('GithubApiClient()', () => {
  let client
  beforeEach(() => {
    client = GithubApiClient(config.organization, config.repository, token)

    mock.onGet().reply(function(config) {
      return [200, {}]
    });
  })

  it('returns axios instance for general repo', () => {
    return client.get('foo').then((request) => {
      expect(request.config.baseURL).toBe(baseURL)
    })
  })

  it('returns axios instance for specific repo', () => {
    return client.repo.get('foo').then((request) => {
      expect(request.config.baseURL).toBe(`${baseURL}repos/${config.organization}/${config.repository}/`)
    })
  })
})
