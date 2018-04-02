import serialization from './github-serialization.js'
import auth from './github-oauth.js'
import githubApiClient from './github-api-client.js'

/*
 * GitHub Issues API. Handles saving and polling of
 * projects, stored as github issue comments.
 *
 * Expects a configuration of:
 * {
 *    organization: 'bkkhack',
 *    repository: 'hackmap',
 *    label: 'BKKHack Main Thread',
 *    pollIntervalSeconds: 60,
 *    onAuthenticationRequired: () => Promise(token),
 *    onProjectsUpdated: (projects) => {},
 *    onError: (error) => {}
 * }
 */
export default class GitHubIssueService {
  constructor (config) {
    this.lastUpdateSent = new Date(0)
    this.config = config
    this.github = githubApiClient(config.organization, config.repository)

    // if the user has already logged in (e.g. in a previous session), use the
    // authenticated client for all operations. Authenticated calls have a
    // higher rate limit, even for calls that don't require authentication
    if (auth.isLoggedIn()) {
      this.ensureAuthenticatedClient().then(() => this.startPolling())
    } else {
      this.startPolling()
    }
  }

  startPolling () {
    // issue ajax requests to load data from github
    // the model will be updated periodically from the callbacks
    this.getIssues()
      .then((issues) => { this.getMainThread(issues) })
      .then(() => this.pollIssueForComments())
      .catch((err) => {
        this.reportError(err)
        this.config.onError(err)
      })
  }

  /**
   * @returns {Promise}
   */
  getIssues () {
    return this.github.repo
      .get('issues', {
        params: { labels: this.config.label },
        headers: serialization.commentFormat
      })
      .then((response) => response.data)
      .catch((err) => {
        this.reportError(err)
        throw new Error('Unable to get a list of issues from github')
      })
  }

  getMainThread (issues) {
    if (!issues.length) {
      throw new Error('Could not find an open issue labeled: ' + this.config.label)
    }

    let issue
    if (this.config.issueNumber === '') {
      issue = issues[0]
    } else {
      issue = issues.find(i => i.number === parseInt(this.config.issueNumber))
      if (issue === undefined) {
        throw new Error(`Could not find an open issue labeled: ${this.config.label} and numbered: ${this.config.issueNumber}`)
      }
    }

    this.issueNumber = issue.number

    var thread = serialization.deserializeIssueToMainThread(issue)
    this.config.onMainThreadLoaded(thread)
  }

  postNewProject (project) {
    return this.updateProjectAjaxCall(project, 'post', 'issues/' + this.issueNumber + '/comments')
  }

  updateProject (project) {
    return this.updateProjectAjaxCall(project, 'patch', 'issues/comments/' + project.id)
  }

  updateProjectAjaxCall (project, httpVerb, url) {
    return this.ensureAuthenticatedClient()
      .then(() => {
        this.lastUpdateSent = new Date()
        let body = serialization.serializeProjectToComment(project)
        return this.github.repo[httpVerb](url, { body: body }, {
          headers: serialization.commentFormat
        })
      })
      .then(response => {
        return serialization.deserializeCommentToProject(response.data)
      })
  }

  deleteProject (id) {
    return this.ensureAuthenticatedClient()
      .then(() => {
        return this.github.repo.delete('issues/comments/' + id)
      })
  }

  pollIssueForComments () {
    let commentsUrl = 'issues/' + this.issueNumber + '/comments'
    var etag

    var poll = (isFirstPoll) => {
      // first request should not be cached by the browser.
      // this prevents users from refreshing immediately after
      // entering their hack and not seeing their hack appear.
      var now = new Date()
      var requestUrl = isFirstPoll
        ? commentsUrl + '?nocache=' + now.getTime()
        : commentsUrl

      // don't poll if the user sent an update in the last 15s.
      // GitHub's API doesn't immediately reflect the latest information,
      // so give it some time for updates to propagate.
      if (now - this.lastUpdateSent < 15000) {
        console.log('skipping poll because of a recent update from this client')
        return Promise.resolve()
      }
      if (window.document.hidden) {
        console.log('skipping poll because tab is hidden')
        window.addEventListener('visibilitychange', poll, {once: true})
        return Promise.resolve()
      }

      console.log('polling with etag ' + etag)
      return this.github.repo
        .get(requestUrl, {
          headers: Object.assign(
            serialization.commentFormat,
            // use etag for caching, as described in https://developer.github.com/v3/#conditional-requests
            etag ? { 'If-None-Match': etag } : { }
          )
        })
        .then(response => {
          console.log('poll response ' + response.status)
          if (response.status === 200) {
            etag = response.headers.etag
            var projects = response.data.map(serialization.deserializeCommentToProject)
            this.config.onProjectsUpdated(projects)
          }
        })
        .catch(err => {
          this.reportError(err)
          this.config.onError(new Error('Failed retrieving ideas'))
        })
    }

    console.log('start polling')
    let interval = 1000 * this.config.pollIntervalSeconds
    window.setInterval(poll, interval)
    return poll(true)
  }

  /**
   * Call the onAuthenticationRequired callback to get an auth token
   * and create an authenticated github api client from that token
   * @param reauthenticateOnError - defaults to true, if authentication fails (e.g. to a expired token) should we attempt to reauthenticate?
   */
  ensureAuthenticatedClient (reauthenticateOnError = true) {
    return this.config.onAuthenticationRequired()
      .then(token => {
        // if we're not currently authenticated, use the
        // token to create an authenticated client.
        if (!this.github.isAuthenticated) {
          this.github = githubApiClient(this.config.organization, this.config.repository, token)
          this.github.isAuthenticated = true
          return this.github.get('user')
        }
      }).then(response => {
        if (response) {
          this.config.onUserAuthenticated(response)
        }
      }).catch(err => {
        console.log(err)
        auth.logOut()
        if (reauthenticateOnError) {
          this.github.isAuthenticated = false
          return this.ensureAuthenticatedClient(false)
        }
      })
  }

  deauthenticateClient () {
    auth.logOut()
    this.github = githubApiClient(this.config.organization, this.config.repository)
  }

  reportError (err) {
    console.error(err)
  }
}
