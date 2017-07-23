<template>
  <div class="projects side-column">
    <div class="project-form" v-bind:class="{ open: form.isOpen }">
      <input v-model="form.title" type="text" placeholder="Topic" autofocus>
      <textarea v-model="form.description" placeholder="More description (optional)"></textarea>
    </div>
    <button class="glow-button" v-on:click="toggleForm">+ Add your hack</button>
    <div v-for="project in projects"
      v-on:dragstart="drag"
      v-on:click="selectedProject = project"
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
  import githubIssue from '../github-issues.js'
  export default {
    name: 'left',
    props: ['form', 'projects'],
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
      // the drag handler for each project list item.
      drag (event) {
        console.log(event)
        var avatar = event.target.querySelector('img')
        event.dataTransfer.setDragImage(avatar, 20, 20)
        var projectId = event.target.dataset.id
        event.dataTransfer.setData('projectId', projectId)
      }
    }
  }
</script>

<style>
</style>
