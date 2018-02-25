<template>
  <div id="appContainer">
    <left
      @toggleForm="toggleForm" @updateSelectedProject="updateSelectedProject"
      @drag="leftDrag"
      :state="state"
      :form="form" :projects="projects"
      :selectedProject="selectedProject" :username="username" :userAlreadyHasProject="userAlreadyHasProject">
    </left>
    <center
      @updateSelectedProject="updateSelectedProject"
      @login="login" @logout="logout" @drop="centerDrop"
      :projects="projects" :selectedProject="selectedProject"
      :mainThread="mainThread" :username="username"
      :mapWidth="mapWidth" :mapHeight="mapHeight"
      >
    </center>
    <right
      @toggleEditMode="toggleEditMode" @updateProject="updateProject" @deleteProject="deleteProject"
      :selectedProject="selectedProject" :username="username">
    </right>
  </div>
</template>

<script>
import GitHubIssueService from '../github-issues.js'
import auth from '../github-oauth.js'
import Left from './Left.vue'
import Center from './Center.vue'
import Right from './Right.vue'

let githubIssue
export default {
  name: 'hackmap',
  props: {
    issueNumber: {
      default: '',
      type: String
    }
  },
  data () {
    return {
      state: '',
      mainThread: {
        title: '',
        helpText: ''
      },
      projects: [],
      mapWidth: 0,
      mapHeight: 0,
      form: {
        isOpen: false,
        title: '',
        descriptionText: ''
      },
      authenticationUrl: '',
      username: '',
      userId: '',
      userAlreadyHasProject: false,
      selectedProject: {
        id: '',
        avatar: '',
        username: '',
        editMode: '',
        title: '',
        descriptionHtml: '',
        descriptionText: ''
      }
    }
  },
  methods: {
    toggleForm () {
      if (!this.form.isOpen) {
        this.form.isOpen = true
        return
      }
      this.form.title = this.form.title.trim()
      this.form.descriptionText = this.form.descriptionText.trim()

      if (!this.form.title && !this.form.descriptionText) {
        // empty form, close it.
        this.form.isOpen = false
        return
      } else if (!this.form.title) {
        // user filled in a description, but not a title
        alert('Please enter a topic for your project')
        return
      } else {
        // title and optional description provided, save the text
        githubIssue.postNewProject(this.form)
          .then(project => {
            // add the new project and blank the form.
            this.projects.push(project)
            this.form.title = ''
            this.form.descriptionText = ''
          })
          .catch(err => console.error(err))
        this.form.isOpen = false
      }
    },
    leftDrag (event) {
      var avatar = event.target.querySelector('img')
      event.dataTransfer.setDragImage(avatar, 20, 20)
      var projectId = event.target.dataset.id
      event.dataTransfer.setData('projectId', projectId)
    },
    updateSelectedProject (project) {
      this.selectedProject = project
    },
    centerDrop (event) {
      var projectId = event.dataTransfer.getData('projectId')
      var project = this.projects.filter(p => p.id === parseInt(projectId))[0]
      this.updateMapDimensions()
      // record old x and y values in case the API rejects our update, so we can revert to them
      var oldX = project.x
      var oldY = project.y
      // the map is a percentage width of the overall window, so we need
      // to save x and y as percentage values.
      project.x = event.offsetX / this.mapWidth
      project.y = event.offsetY / this.mapHeight
      githubIssue.updateProject(project)
        .catch(err => {
          console.log('update rejected', err)
          project.x = oldX
          project.y = oldY
        })
    },
    updateMapDimensions () {
      var floorplan = this.$el.querySelector('.floorplan')
      this.mapWidth = floorplan.clientWidth
      this.mapHeight = floorplan.clientHeight
    },
    login () {
      githubIssue.ensureAuthenticatedClient().then(data => console.log(data))
    },
    logout () {
      this.username = ''
      githubIssue.deauthenticateClient()
    },
    toggleEditMode () {
      if (!this.selectedProject.editMode) { // entering edit mode
        this.selectedProject.backup = {
          title: this.selectedProject.title,
          descriptionText: this.selectedProject.descriptionText
        }
      } else { // cancelling edit mode
        this.selectedProject.title = this.selectedProject.backup.title
        this.selectedProject.descriptionText = this.selectedProject.backup.descriptionText
      }
      this.selectedProject.editMode = !this.selectedProject.editMode
    },
    updateProject () {
      githubIssue.updateProject(this.selectedProject)
        .then(updatedProject => {
          this.selectedProject = updatedProject
          this.selectedProject.editMode = false
        })
        .catch(err => {
          console.log('update rejected', err)
          var backup = this.selectedProject.backup
          this.selectedProject.title = backup.title
          this.selectedProject.descriptionText = backup.descriptionText
        })
    },
    deleteProject (id) {
      githubIssue.deleteProject(id)
        .then(() => {
          this.selectedProject = {
            id: '',
            avatar: '',
            username: '',
            editMode: '',
            title: '',
            descriptionText: ''
          }
          this.userAlreadyHasProject = false
          const indexResult = this.projects.findIndex(project => project.id === id)
          this.projects.splice(indexResult, 1)
        })
    },
    notifyError (msg) {
      if (msg.hasOwnProperty('message')) {
        alert(msg.message)
      } else {
        alert('Oh no, something went wrong')
      }
    }
  },
  components: {
    Left,
    Center,
    Right
  },
  mounted () {
    githubIssue = new GitHubIssueService({
      organization: 'bkkhack',
      repository: 'hackmap',
      label: 'BKKHack Main Thread',
      onAuthenticationRequired: auth.getOAuthToken,
      pollIntervalSeconds: 60,
      onProjectsUpdated: projects => {
        this.$set(this.$data, 'state', 'running')
        this.projects = projects
        const loggingInUserComment = this.projects.find(comment => comment.userId === this.userId)
        if (loggingInUserComment !== undefined) {
          this.userAlreadyHasProject = true
        }
      },
      onMainThreadLoaded: thread => {
        this.mainThread.helpText = thread.body
        this.mainThread.title = thread.title
      },
      onUserAuthenticated: response => {
        this.username = response.data.login
        this.userId = response.data.id
      },
      issueNumber: this.issueNumber,
      onError: errMsg => {
        this.notifyError(errMsg)
      },
      onInit: () => {
        this.$set(this.$data, 'state', 'init')
      }
    })
    // we need to calculate map dimensions in order to place the avatars
    // we handle three cases:
    // if the map loads after this code runs.
    this.$el.querySelector('.floorplan')
      .addEventListener('load', this.updateMapDimensions)
    // if this code runs after the image loads
    this.updateMapDimensions()
    // and on resize
    window.addEventListener('resize', this.updateMapDimensions)
  }
}
</script>

<style>
  html, body, #app, #appContainer {
    margin: 0;
    padding: 0;
    height: 100%;
  }
  html {
    /* css blueprint pattern */
    background-color:#269;
    background-image: linear-gradient(rgba(255, 255, 255, .1) 2px, transparent 2px),
    linear-gradient(90deg, rgba(255, 255, 255, .2) 1px, transparent 2px),
    linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px);
    background-size:100px 100px, 100px 100px, 20px 20px, 20px 20px;
    background-position:-2px -2px, -2px -2px, -1px -1px, -1px -1px;
  }
  #appContainer {
    color:#fff;
    font-family:sans-serif;
    display:flex;
    flex-wrap:wrap;
    flex-direction:row;
    justify-content:flex-start;
    align-items:stretch;
  }
  a {
    color:#fff;
    font-weight:bold;
    text-decoration:none;
    cursor:pointer;
  }
  h1 {
    font-weight:normal;
    text-align:center;
    font-size:24pt;
    margin:0;
    -webkit-user-select: none;
    user-select: none;
  }
  input[type='text'], textarea {
    box-sizing:border-box;
    border-radius:5px;
    font-size:1em;
    width:100%;
    margin-bottom:5px;
    padding: 0.4em;
    outline:none;
    transition:background-color linear 0.2s;
    background-color:rgba(255,255,255,.9);
  }
  input:focus,
  textarea:focus {
    background-color:rgba(255,255,255,1);
  }
  textarea {
    height:200px;
  }
  img[draggable='true'],
  div[draggable='true'] {
    cursor:pointer;
  }
  [v-cloak] {
    /* If marked with v-cloak (vue cloak), this overrides everything.
     * Vue will remove this attribute when it's initialized. */
  visibility: hidden !important;
  }

  /*
   * General app layout
   */

  .center-column,
  .side-column {
    padding:10px;
    min-height:550px;
    overflow-y:auto;
  }
  .center-column {
    order: 2;
    flex: 1;
    background-image: radial-gradient(circle at 50% 50%, rgba(0, 153, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%);
    position: relative;
  }
  .side-column {
    background-color:rgba(51, 51, 51, 0.8);
    box-shadow:0 0 10px #000;
    box-sizing:border-box;
    flex-basis: 300px;
  }
  .projects.side-column {
    order: 1;
    overflow: scroll;
  }
  .details.side-column {
    order: 3;
    text-align:center;
    padding-top:60px;
    position: relative;
  }

  /* github avatar resizes -- github stopped respecting the &s parameter
   * for default generated avatar images, so we manually do it here */
  img[src$="s=40"] { width: 40px; height: 40px; }
  img[src$="s=120"] { width: 120px; height: 120px; }
</style>
