import axios from 'axios'

function getApiConfig (token, apiPath) {
  var config = {
    baseURL: baseURL + (apiPath || ''),
    validateStatus: status => status >= 200 && (status < 300 || status === 304)
  }
  if (token) {
    config.headers = { 'Authorization': 'token ' + token }
  }
  return config
}

export const baseURL = 'https://api.github.com/'
export default function (org, repo, token) {
  // general github ajax client
  let github = axios.create(getApiConfig(token))

  // repo-specific ajax client
  github.repo = axios.create(getApiConfig(token, `repos/${org}/${repo}/`))

  return github
}
