<template>
  <div class="projects side-column">
    <div class="project-form" v-bind:class="{ open: form.isOpen }">
      <input v-model="form.title" type="text" placeholder="Topic" autofocus>
      <textarea v-model="form.description" placeholder="More description (optional)"></textarea>
    </div>
    <button class="glow-button" v-on:click="toggleForm">+ Add your hack</button>
    <div v-for="project in projects"
      v-on:dragstart="drag"
      v-on:click="updateSelectedProject(project)"
      v-bind:key="project.id"
      v-bind:data-id="project.id"
      v-bind:class="{ selected: selectedProject === project }"
      v-bind:draggable="project.username === username"
      v-cloak
      class="project">
    <img v-bind:src="project.avatar_thumbnail" v-bind:alt="project.username" draggable="false" />
    {{project.title}}
    </div>
    <div class="details" v-if="projects.length === 0">
      No hacks yet! You can be first!
    </div>
    <div class="loader" v-if="projects.loading">
      <div class="loader1"></div>
      <div class="loader2"></div>
      <div class="loader3"></div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'left',
    props: ['form', 'projects', 'selectedProject', 'username'],
    methods: {
      toggleForm () {
        this.$emit('toggleForm')
      },
      drag (event) {
        this.$emit('drag', event)
      },
      updateSelectedProject (project) {
        this.$emit('updateSelectedProject', project)
      }
    }
  }
</script>

<style>
</style>
