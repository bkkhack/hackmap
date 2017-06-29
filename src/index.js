/*
 * The Vue.js UI.
 * See index.html for the associated DOM
 */
import Vue from 'vue';
import GitHubIssueService from './github-issues.js'
import GitHubAuth from './github-oauth.js'

// this is the entire datamodel for the app.
// Vue.js requires the datamodel to be initialized with empty values
// this is so it can set up getters/setters that refresh the ui on change.
const model = {
    helpText: "",
    projects: [],
    mapWidth:0,
    mapHeight:0,
    form: {
        isOpen: false,
        title: "",
        description: ""
    },
    authenticationUrl: "",
    username: "",
    selectedProject: { }
}
model.projects.loading = true;

// encapsulates access to the github issues API
const githubIssue = new GitHubIssueService({
    organization: "bkkhack",
    repository: "hackmap",
    label: "BKKHack Main Thread",
    onAuthenticationRequired: GitHubAuth.getOAuthToken,
    pollIntervalSeconds: 60,
    onProjectsUpdated: projects => {
        model.projects = projects;
    },
    onHelpText: helpText => {
        model.helpText = helpText;
    },
    onUserAuthenticated: response => {
        model.username = response.data.login;
    }
});

// left-side column with the list of projects, and project entry form.
var projectsColumn = new Vue({
    el: '.projects.side-column',
    data: model,
    methods: {
        // open/close/submit the 'new project' form
        toggleForm: function() {
            if(!this.form.isOpen) {
                this.form.isOpen = true;
                return;
            }
            this.form.title = this.form.title.trim();
            this.form.description = this.form.description.trim();

            if(!this.form.title && !this.form.description) {
                //empty form, close it.
                this.form.isOpen = false;
                return;
            } else if(!this.form.title) {
                //user filled in a description, but not a title
                alert("Please enter a topic for your project");
                return;
            } else {
                // title and optional description provided, save the text
                githubIssue.postNewProject(this.form)
                    .then(project => {
                        // add the new project and blank the form.
                        this.projects.push(project);
                        this.form.title = "";
                        this.form.description = "";
                    })
                    .catch(err => console.error(err));
                this.form.isOpen = false;
            }
        },
        // the drag handler for each project list item.
        drag: function(event) {
            console.log(event);
            var avatar = event.target.querySelector("img");
            event.dataTransfer.setDragImage(avatar, 20, 20);
            var projectId = event.target.dataset.id;
            event.dataTransfer.setData("projectId", projectId);
        }
    }
})

// center column with the floorplan and draggable avatars
var map = new Vue({
    el: '.center-column',
    data: model,
    methods: {
        dragover: function(event) {
            event.preventDefault(); // mark this element as a drop target.
            event.dataTransfer.dropEffect = 'copy'; 
        },
        drag: function(event) {
            var projectId = event.target.dataset.id;
            event.dataTransfer.setData("projectId", projectId);
        },
        drop: function(event) {
            var projectId = event.dataTransfer.getData("projectId");
            var project = model.projects.filter(p => p.id == projectId)[0];
            this.updateMapDimensions();
            // record old x and y values in case the API rejects our update, so we can revert to them
            var oldX = project.x;
            var oldY = project.y;
            // the map is a percentage width of the overall window, so we need
            // to save x and y as percentage values.
            project.x = event.offsetX / model.mapWidth;
            project.y = event.offsetY / model.mapHeight;
            githubIssue.updateProject(project)
                .catch(err => {
                    console.log("update rejected");
                    project.x = oldX;
                    project.y = oldY;
                });
        },
        updateMapDimensions: function() {
            var floorplan = this.$el.querySelector('.floorplan');
            model.mapWidth = floorplan.clientWidth;
            model.mapHeight = floorplan.clientHeight;
        },
        login: function() {
            githubIssue.ensureAuthenticatedClient();
        },
        logout: function() {
            model.username = "";
            githubIssue.deauthenticateClient();
        }
    },
    mounted: function () {
        window.addEventListener('resize', this.updateMapDimensions);
        this.updateMapDimensions();
    },
    beforeDestroy: function () {
        window.removeEventListener('resize', this.updateMapDimensions);
    }
});

// the right-side column that displays the selected project details
var projectDetails = new Vue({
    el: '.details.side-column',
    data: model,
    methods: {
        toggleEditMode: function() {
            let project = model.selectedProject;
            if(!project.editMode) { // entering edit mode
                project.backup = {
                    title: project.title,
                    description: project.description,
                }
            } else { // cancelling edit mode
                project.title = project.backup.title;
                project.description = project.backup.description;
            }
            project.editMode = !project.editMode;
        },
        updateProject: function() {
            githubIssue.updateProject(model.selectedProject)
                .then(() => {
                    model.selectedProject.editMode = false;
                })
                .catch(err => {
                    console.log("update rejected");
                    var backup = model.selectedProject.backup;
                    model.selectedProject.title = backup.title;
                    model.selectedProject.description = backup.description;
                });
        }
    }
})
