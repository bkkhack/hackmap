<template>
  <div id="appContainer">
    <header-bar class="header-bar"
      @login="login" @logout="logout"
      :user="user" :mainThread="mainThread" />
    <side-bar class="side-bar"
      @toggleForm="toggleForm" @updateSelectedProject="updateSelectedProject"
      @toggleEditMode="toggleEditMode" @updateProject="updateProject" @deleteProject="deleteProject"
      @drag="leftDrag"
      :projects="projects" :selectedProjectId="selectedProjectId"
      :user="user" :state="state" :form="form" />
    <hack-map class="hack-map"
      @updateSelectedProject="updateSelectedProject"
      @drop="centerDrop" @closeModals="closeModals"
      :projects="projects" :selectedProjectId="selectedProjectId"
      :user="user" :floorplan="floorplan" />
  </div>
</template>

<script>
import GitHubIssueService from '../github-issues.js'
import Auth from '../github-oauth.js'
import HeaderBar from './header-bar.vue'
import SideBar from './side-bar.vue'
import HackMap from './hack-map.vue'

let githubIssue
export default {
  name: 'app',
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
      selectedProjectId: '',
      projects: [],
      form: {
        isOpen: false,
        title: '',
        descriptionText: ''
      },
      authenticationUrl: '',
      user: {
        id: '',
        username: '',
        hasProject: false
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
    closeModals () {
      this.selectedProjectId = null
      this.form.isOpen = false
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
      this.user.username = ''
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
          this.user.hasProject = false
          this.selectedProjectId = null
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
    HeaderBar,
    SideBar,
    HackMap
  },
  mounted () {
    githubIssue = new GitHubIssueService({
      organization: 'bkkhack',
      repository: 'hackmap',
      label: 'BKKHack Main Thread',
      onAuthenticationRequired: Auth.getOAuthToken,
      pollIntervalSeconds: 60,
      onProjectsUpdated: projects => {
        this.$set(this.$data, 'state', 'running')
        this.user.hasProject = projects
            .some(project => project.userId === this.user.id)

        // don't reset projects if the user is editing one of them
        if (!this.projects.some(project => project.editMode)) {
          this.projects = projects
        }
      },
      onMainThreadLoaded: thread => {
        this.mainThread.helpHtml = thread.helpHtml
        this.mainThread.title = thread.title
        this.floorplan.url = thread.floorplanUrl
      },
      onUserAuthenticated: response => {
        this.user.username = response.data.login
        this.user.id = response.data.id
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
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.updateMapDimensions)
  }
}
</script>

<style>
  html, body, #app, #appContainer {
    margin: 0;
    padding: 0;
    height: 100%;
    color: #fff;
    font-family: Raleway, sans-serif;
  }
  html {
    /* css blueprint pattern */
    background-color:#269;
    background-color:#3481bb;
    background-image: linear-gradient(rgba(255, 255, 255, .1) 2px, transparent 2px),
    linear-gradient(90deg, rgba(255, 255, 255, .2) 1px, transparent 2px),
    linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px);
    background-size:100px 100px, 100px 100px, 20px 20px, 20px 20px;
    background-position:-2px -2px, -2px -2px, -1px -1px, -1px -1px;
  }
  #appContainer {
    display:grid;
    grid-template-rows: 60px auto;
    grid-template-columns: 300px auto;
    grid-template-areas: "side-bar  header-bar"
                         "side-bar    hack-map";
  }
  .header-bar {
    grid-area: header-bar;
  }
  .side-bar {
    grid-area: side-bar;
  }
  .add-button {
    height:60px;
  }
  .hack-map {
    grid-area: hack-map;
  }
  a {
    font-weight:bold;
    text-decoration:none;
    cursor:pointer;
    color:#fff;
  }
  input[type='text'], textarea {
    box-sizing:border-box;
    font-family:sans-serif;
    font-size:1em;
    width:100%;
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
  img[draggable='true'],
  div[draggable='true'] {
    cursor:pointer;
  }
  [v-cloak] {
    /* If marked with v-cloak (vue cloak), this overrides everything.
     * Vue will remove this attribute when it's initialized. */
    visibility: hidden !important;
  }

  /* github avatar resizes -- github stopped respecting the &s parameter
   * for default generated avatar images, so we manually do it here */
  img[src$="s=40"] { width: 40px; height: 40px; }
  img[src$="s=120"] { width: 120px; height: 120px; }
</style>
