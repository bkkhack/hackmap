/* Handles converting the app's concept of a 'project'
 * to/from the GitHub API's concept of an 'issue'
 */

const commentExtractionRegex = /<!-- ([.\d]+),([.\d]+) -->/
const mainThreadAttributesRegex = /<!--\s*floorplan\s*:\s*([^,\s]+),?\s*-->/

function parseCoordinatesFromComment (commentLines) {
  var lastLine = commentLines.slice(-1)[0]
  var matches = commentExtractionRegex.exec(lastLine)

  return matches ? { x: matches[1], y: matches[2] }
    : { x: 0, y: 0 }
}

export default {

  commentFormat: { 'Accept': 'application/vnd.github.VERSION.full+json' },

  deserializeCommentToProject: function (comment) {
    var textLines = comment.body.split('\r\n')
    var coords = parseCoordinatesFromComment(textLines)
    // title is the first line, description is everything after the first line
    var title = textLines[0]
    var descriptionText = textLines.length > 1 ? textLines[1].trim() : ''
    var descriptionHtml = comment.body_html.substring(comment.body_html.indexOf('\n')).trim()
    return {
      id: comment.id,
      title: title,
      descriptionText: descriptionText,
      descriptionHtml: descriptionHtml,
      username: comment.user.login,
      userId: comment.user.id,
      avatar_thumbnail: comment.user.avatar_url + '&s=' + 40,
      avatar: comment.user.avatar_url + '&s=' + 80,
      x: coords.x,
      y: coords.y,
      editMode: false
    }
  },

  serializeProjectToComment: function (project) {
    let body = project.title + '\r\n' +
      (project.descriptionText || '') + '\r\n' +
      `<!-- ${project.x},${project.y} -->`
    return body
  },

  deserializeIssueToMainThread: function (issue) {
    let [, floorplanUrl] = mainThreadAttributesRegex.exec(issue.body)

    return {
      title: issue.title,
      helpHtml: issue.body_html,
      number: issue.number,
      floorplanUrl: floorplanUrl
    }
  }
}
