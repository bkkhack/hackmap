import axios from 'axios'

export const baseURL = 'https://api.github.com/'

export default function (org, repo, token) {
  function getApiConfig (apiPath) {
    var config = {
      baseURL: baseURL + (apiPath || ''),
      validateStatus: status => status >= 200 && (status < 300 || status === 304)
    }
    if (token) {
      config.headers = { 'Authorization': 'token ' + token }
    }
    return config
  }
  // general github ajax client
  let github = axios.create(getApiConfig())

  // repo-specific ajax client
  github.repo = axios.create(getApiConfig(`repos/${org}/${repo}/`))

  return github
}
