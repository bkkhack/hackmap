/* Handles converting the app's concept of a 'project'
 * to/from the GitHub API's concept of an 'issue'
 */

const commentExtractionRegex = /<!-- ([.\d]+),([.\d]+) -->/

function parseCoordinatesFromComment (commentLines) {
  var lastLine = commentLines.slice(-1)[0]
  var matches = commentExtractionRegex.exec(lastLine)

  return matches ? { x: matches[1], y: matches[2] }
    : { x: 0, y: 0 }
}

export default {
  deserializeCommentToProject: function (comment) {
    var textLines = comment.body.split('\r\n')
    var coords = parseCoordinatesFromComment(textLines)
    return {
      id: comment.id,
      title: textLines[0],
      description: textLines[1],
      username: comment.user.login,
      userId: comment.user.id,
      avatar_thumbnail: comment.user.avatar_url + '&s=' + 40,
      avatar: comment.user.avatar_url + '&s=' + 120,
      x: coords.x,
      y: coords.y,
      editMode: false
    }
  },

  serializeProjectToComment: function (project) {
    let body = project.title + '\r\n' +
      (project.description || '') + '\r\n' +
      `<!-- ${project.x},${project.y} -->`
    return body
  }
}
