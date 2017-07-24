/*
 * Handles the 'oauth dance' for our application.
 */
import axios from 'axios' // ajax library

const clientId = '1b717d04ec7f3615bb18'
// the following url needs to match the app configuration on github.com
const landingPage = window.location.href.indexOf('index.html') >= 0 ? window.location.href.replace('index.html', 'oauth_redirect.html') : window.location.href + 'oauth_redirect.html'
const tokenKey = 'token'
const oAuthUrl = `https://github.com/login/oauth/authorize?scope=public_repo&redirect_uri=${landingPage}&client_id=${clientId}`
// our heroku instance that hides the oauth secret. running https://github.com/prose/gatekeeper
const codeToTokenUrl = 'https://bkkhackmap.herokuapp.com/authenticate/'

// HTTP Options call to wake the heroku instance. we don't care about the
// response. we just want the oauth login to be quick.
axios.options(codeToTokenUrl)

export default {
  isLoggedIn: function () {
    return !!window.localStorage.getItem(tokenKey)
  },
  logOut: function () {
    window.localStorage.removeItem(tokenKey)
  },
  // implements https://developer.github.com/v3/oauth/#web-application-flow
  getOAuthToken: function () {
    return new Promise((resolve, reject) => {
      // if we already have a token, just return it
      var token = window.localStorage.getItem(tokenKey)
      if (token) {
        resolve(token)
        return
      }
      // otherwise, open a window to do the github login
      // github will redirect to landingPage, which will fire an
      // event with the github auth code
      var oauthWindow = window.open(oAuthUrl) // needs to be a new window. github can't be embedded in an iframe for security reasons
      window.addEventListener('oauth-code-received', function (event) {
        var code = event.detail
        // we received the code exchange it for an auth token.
        // this part needs to interact with a server because we need to hide the oAuth secret.
        // the server is just a heroku app running https://github.com/prose/gatekeeper
        axios.get(codeToTokenUrl + code)
          .then(response => {
            window.localStorage.setItem(tokenKey, response.data.token)
            oauthWindow.close()
            resolve(response.data.token)
          })
          .catch(error => reject(error))
      })
    })
  }
}
