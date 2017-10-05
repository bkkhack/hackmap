import serialization from '../src/github-serialization.js'

describe('serialization', () => {
  it('should deserialize a github comment to a project object', () => {
    let comment = {
      id: 555,
      body: 'doomsday device\r\ntime to take over the world!<!--0.8,0.2-->',
      user: {
        login: 'Bob',
        avatar_url: 'http://www.example.com/bob.jpg'
      }
    }
    let project = serialization.deserializeCommentToProject(comment)
    expect(project.title).toEqual('doomsday device')
  })
})

