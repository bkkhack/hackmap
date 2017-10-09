<template>
  <div id="appContainer">
    <left
      @toggleForm="toggleForm" @updateSelectedProject="updateSelectedProject"
      @drag="leftDrag"
      :form="form" :projects="projects"
      :selectedProject="selectedProject" :username="username" :isHasIssue="isHasIssue">
    </left>
    <center
      @updateSelectedProject="updateSelectedProject"
      @login="login" @logout="logout" @drop="centerDrop"
      :projects="projects" :selectedProject="selectedProject"
      :helpText="helpText" :username="username"
      :mapWidth="mapWidth" :mapHeight="mapHeight"
      >
    </center>
    <right
      @toggleEditMode="toggleEditMode" @updateProject="updateProject"
      :selectedProject="selectedProject" :username="username">
    </right>
  </div>
</template>

<script>
import GitHubIssueService from './github-issues.js'
import auth from './github-oauth.js'
import Left from './components/Left.vue'
import Center from './components/Center.vue'
import Right from './components/Right.vue'

let githubIssue
export default {
  name: 'app',
  data () {
    return {
      helpText: '',
      projects: [],
      mapWidth: 0,
      mapHeight: 0,
      form: {
        isOpen: false,
        title: '',
        description: ''
      },
      authenticationUrl: '',
      username: '',
      userId: '',
      isHasIssue: false,
      selectedProject: {
        id: '',
        avatar: '',
        username: '',
        editMode: '',
        title: '',
        description: ''
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
      this.form.description = this.form.description.trim()

      if (!this.form.title && !this.form.description) {
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
            this.form.description = ''
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
          description: this.selectedProject.description
        }
      } else { // cancelling edit mode
        this.selectedProject.title = this.selectedProject.backup.title
        this.selectedProject.description = this.selectedProject.backup.description
      }
      this.selectedProject.editMode = !this.selectedProject.editMode
    },
    updateProject () {
      githubIssue.updateProject(this.selectedProject)
        .then(() => {
          this.selectedProject.editMode = false
        })
        .catch(err => {
          console.log('update rejected', err)
          var backup = this.selectedProject.backup
          this.selectedProject.title = backup.title
          this.selectedProject.description = backup.description
        })
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
        this.projects = projects
        const loggingInUserComment = this.projects.find(comment => comment.userId === this.userId)
        if (loggingInUserComment !== undefined) {
          this.isHasIssue = true
        }
      },
      onHelpText: helpText => {
        this.helpText = helpText
      },
      onUserAuthenticated: response => {
        this.username = response.data.login
        this.userId = response.data.id
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
html, body, #appContainer {
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

.projects {
    order: 1;
    overflow: scroll;
}
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
.details {
    order: 3;
    text-align:center;
    padding-top:60px;
}


/*
 * left column -- project list and form
 */
.glow-button {
    border-radius:4px;
    border: 2px dashed #326fce;
    box-sizing:border-box;
    color: #326fce;
    font-size:18pt;
    height:40px;
    height:40px;
    width:100%;
    background-color:transparent;
    outline:none;
    cursor:pointer;
    transition: all linear 0.2s;
    animation: glow-button 1s infinite alternate
}
.glow-button:hover {
    animation: none;
    border-color: #3a7ce2;
    color: #3a7ce2;
}
.glow-button:active {
    color: #6af;
}
.glow-button.disabled {
    border: 2px dashed #6384b7 !important;
    color: #6384b7 !important;
    cursor: default !important;
}
@keyframes glow-button {
    from { color: #326fce; border-color: #326fce }
    to { color: #3a7ce2; border-color: #3a7ce2 }
}
.project-form {
    overflow:hidden;
    max-height:0;
    transition:max-height linear 0.4s;
}
.project-form.open {
    max-height:500px;
}
.project {
    -webkit-user-select: none;
    user-select: none;
    box-sizing:border-box;
    height:42px;
    line-height:42px;
    background-color:rgba(255, 255, 255, 0.1);
    border:1px solid #777;
    margin:10px 0;
    overflow:hidden;
}
.project.selected {
    border:1px solid #397ce2;
}
.project img {
    vertical-align:middle;
    display:inline-block;
    margin-right:5px;
}
/* css loader in left column */
.loader {
    margin: 50px auto 0;
    width: 70px;
    text-align: center;
}
.loader > div {
    width: 18px;
    height: 18px;
    background-color: rgba(255,255,255,.8);

    border-radius: 100%;
    display: inline-block;
    -webkit-animation: zoom 1.4s infinite ease-in-out both;
    animation: zoom 1.4s infinite ease-in-out both;
}
.loader .loader1 {
    -webkit-animation-delay: -0.32s;
    animation-delay: -0.32s;
}
.loader .loader2 {
    -webkit-animation-delay: -0.16s;
    animation-delay: -0.16s;
}
@keyframes zoom {
    0%, 80%, 100% {
        -webkit-transform: scale(0);
        transform: scale(0);
    } 40% {
        -webkit-transform: scale(1.0);
        transform: scale(1.0);
    }
}

/*
 * Main Column - map
 */
.help-icon {
    position:absolute;
    top:0;
    left:0;
    padding:10px 15px;
    font-size:12pt;
}
.help-icon .help-text {
    display:none;
    position:relative;
    background-color:rgba(51, 51, 51, 0.8);
    box-shadow:0 0 10px #000;
    width:300px;
    min-height:100px;
    color:#fff;
    font-weight:normal;
    z-index:2;
    padding:10px;
    top:-16px;
    white-space: pre-line; /* honor line breaks that the user typed */
}
.help-icon:hover .help-text {
    display:block;
}
.account-status {
    display:block;
    position:absolute;
    top:0;
    right:0;
    margin:0;
    font-size:12pt;
    padding:10px 15px 0 0;
}
.droptarget {
    width:90%;
    position:relative;
    margin:40px auto 0 auto;
}
.floorplan {
    /* floorplan image is assumed to be black vector image */
    -webkit-filter:invert(100%) opacity(40%);
    filter:invert(100%) opacity(40%);
    width:100%;

    z-index:0;
    /* disable drag of the floorplan image */
    pointer-events:none;
}
.marker {
    position:absolute;
    z-index:1;
}
.marker.selected {
    -webkit-animation: bounce 2s 2;
    animation: bounce 2s 2;
}
@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-30px);
    }
    60% {
        transform: translateY(-15px);
    }
}

/*
 * Right column -- project details
 */
.details h2,
.details p {
    margin:15px 0;
}
.details .avatar {
    border: 1px solid #226699;
}
.edit-button {
    position:absolute;
    top:0;
    right:0;
    padding:10px;
}
.selected-project-description {
    white-space: pre-line; /* honor line breaks that the user typed */
}

/* github avatar resizes -- github stopped respecting the &s parameter
 * for default generated avatar images, so we manually do it here */
img[src$="s=40"] { width: 40px; height: 40px; }
img[src$="s=120"] { width: 120px; height: 120px; }
</style>
