<template>
  <div class="center-column">
    <h1>BKKHackmap</h1>
    <a class="help-icon">?<div class="help-text" v-html="helpText"></div></a>
    <a class="account-status" v-if="username" @click="logout" v-cloak>{{username}} (Log out)</a>
    <a class="account-status" v-else @click="login" v-cloak>Log in</a>
    <div class="droptarget"
      @dragover="dragover"
      @drop="drop">
    <img src="../floorplan/chula.jpg" class="floorplan" />
    <img class="marker" width="36"
      v-for="project in projects"
      v-if="project.x"
      v-bind:key="project.id"
      v-bind:draggable="project.username === username"
      @dragstart="drag"
      @click="updateSelectedProject(project)"
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
  export default {
    name: 'center',
    props: ['helpText', 'username', 'projects', 'selectedProject', 'mapWidth', 'mapHeight'],
    methods: {
      dragover (event) {
        this.$emit('dragover', event)
        event.preventDefault() // mark this element as a drop target.
        event.dataTransfer.dropEffect = 'copy'
      },
      drag (event) {
        var projectId = event.target.dataset.id
        event.dataTransfer.setData('projectId', projectId)
      },
      drop (event) {
        this.$emit('drop', event)
      },
      login () {
        this.$emit('login')
      },
      logout () {
        this.$emit('logout')
      },
      updateSelectedProject (project) {
        this.$emit('updateSelectedProject', project)
      }
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.updateMapDimensions)
    }
}
</script>

<style>
</style>
