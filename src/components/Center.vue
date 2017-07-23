<template>
  <div class="center-column">
    <h1>BKKHackmap</h1>
    <a class="help-icon">?<div class="help-text" v-html="helpText"></div></a>
    <a class="account-status" v-if="username" v-on:click="logout" v-cloak>{{username}} (Log out)</a>
    <a class="account-status" v-else v-on:click="login" v-cloak>Log in</a>
    <div class="droptarget"
      v-on:dragover="dragover"
      v-on:drop="drop">
    <img src="../assets/images/carmana.svg" class="floorplan" />
    <img class="marker"
      v-for="project in projects"
      v-if="project.x"
      v-bind:key="project.id"
      v-bind:draggable="project.username === username"
      v-on:dragstart="drag"
      v-on:click="selectedProject = project"
      v-bind:class="{ selected: selectedProject === project }"
      v-bind:data-id="project.id"
      v-bind:style="{ left: mapWidth * project.x - 20 + 'px', top: mapHeight * project.y - 20 + 'px' }"
      v-bind:src="project.avatar_thumbnail"
      v-bind:alt="project.username"
      v-bind:title="project.title"
    />
    </div>
</div>
</template>

<script>
  import githubIssue from '../github-issues.js'
  export default {
    name: 'center',
    props: ['helpText', 'username', 'projects'],
    methods: {
      dragover (event) {
        event.preventDefault() // mark this element as a drop target.
        event.dataTransfer.dropEffect = 'copy'
      },
      drag (event) {
        var projectId = event.target.dataset.id
        event.dataTransfer.setData('projectId', projectId)
      },
      drop (event) {
        var projectId = event.dataTransfer.getData('projectId')
        var project = this.projects.filter(p => p.id === projectId)[0]
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
        githubIssue.ensureAuthenticatedClient()
      },
      logout () {
        this.username = ''
        githubIssue.deauthenticateClient()
      }
    },
    mounted () {
      window.addEventListener('resize', this.updateMapDimensions)
      this.updateMapDimensions()
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.updateMapDimensions)
    }
}
</script>

<style>
</style>
