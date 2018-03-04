<template>
  <div id="appContainer">
    <sidebar
      @toggleForm="toggleForm" @updateSelectedProject="updateSelectedProject"
      @toggleEditMode="toggleEditMode" @updateProject="updateProject" @deleteProject="deleteProject"
      @drag="leftDrag"
      :state="state"
      :form="form" :projects="projects"
      :selectedProjectId="selectedProjectId" :username="username" :userAlreadyHasProject="userAlreadyHasProject">
    </sidebar>
    <center
      @updateSelectedProject="updateSelectedProject"
      @login="login" @logout="logout" @drop="centerDrop"
      :projects="projects" :selectedProjectId="selectedProjectId"
      :mainThread="mainThread" :username="username"
      :floorplan="floorplan"
      >
    </center>
  </div>
</template>

<script>
import GitHubIssueService from '../github-issues.js'
import auth from '../github-oauth.js'
import Sidebar from './Sidebar.vue'
import Center from './Center.vue'

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
      state: 'init',
      mainThread: {
        title: '',
        helpText: ''
      },
      floorplan: {
        url: '',
        width: 0,
        height: 0
      },
      projects: [],
      form: {
        isOpen: false,
        title: '',
        descriptionText: ''
      },
      authenticationUrl: '',
      username: '',
      userId: '',
      userAlreadyHasProject: false,
      selectedProjectId: ''
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
      var avatar = event.target.querySelector('.project-author-avatar')

      var dragIcon = document.createElement('img')
      dragIcon.src = avatar.dataset.dragicon
      event.dataTransfer.setDragImage(dragIcon, 20, 20)

      // event.dataTransfer.setDragImage(avatar, 20, 20)
      var projectId = event.target.dataset.id
      event.dataTransfer.setData('projectId', projectId)
    },
    updateSelectedProject (projectId) {
      this.selectedProjectId = projectId
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
      project.x = event.offsetX / this.floorplan.width
      project.y = event.offsetY / this.floorplan.height
      githubIssue.updateProject(project)
        .catch(err => {
          console.log('update rejected', err)
          project.x = oldX
          project.y = oldY
        })
    },
    updateMapDimensions () {
      var floorplanElement = this.$el.querySelector('.floorplan')
      this.floorplan.width = floorplanElement.clientWidth
      this.floorplan.height = floorplanElement.clientHeight
    },
    login () {
      githubIssue.ensureAuthenticatedClient().then(data => console.log(data))
    },
    logout () {
      this.username = ''
      githubIssue.deauthenticateClient()
    },
    toggleEditMode (projectId) {
      var projectIndex = this.projects.findIndex(project => project.id === projectId)
      var project = this.projects[projectIndex]
      if (!project.editMode) { // entering edit mode
        project.backup = {
          title: project.title,
          descriptionText: project.descriptionText
        }
      } else { // cancelling edit mode
        project.title = project.backup.title
        project.descriptionText = project.backup.descriptionText
      }
      project.editMode = !project.editMode
    },
    updateProject (project) {
      githubIssue.updateProject(project)
        .then(updatedProject => {
          let index = this.projects.findIndex(p => p.id === updatedProject.id)
          this.$set(this.projects, index, updatedProject)
        })
        .catch(err => {
          console.log('update rejected', err)
          var backup = project.backup
          project.title = backup.title
          project.descriptionText = backup.descriptionText
        })
    },
    deleteProject (id) {
      githubIssue.deleteProject(id)
        .then(() => {
          this.selectedProjectId = null
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
    Sidebar,
    Center
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
        this.mainThread.helpText = thread.helpText
        this.mainThread.title = thread.title
        this.floorplan.url = thread.floorplanUrl
      },
      onUserAuthenticated: response => {
        this.username = response.data.login
        this.userId = response.data.id
      },
      issueNumber: this.issueNumber,
      onError: errMsg => {
        this.notifyError(errMsg)
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
    font-size:1em;
    width:100%;
    margin-bottom:5px;
    padding: 0.3em;
    outline:none;
    transition:background-color linear 0.2s;
    background-color:rgba(255,255,255,.9);
    border:1px solid #397ce2;
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
