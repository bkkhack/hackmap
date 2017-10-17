<template>
  <div class="details side-column">
    <template v-if="selectedProject.id" v-cloak>
      <a class="edit-button" v-if="selectedProject.username === username" @click="toggleEditMode">{{selectedProject.editMode ? "X" : "Edit"}}</a>
      <a class="delete-button" v-if="selectedProject.username === username" @click="deleteComment(selectedProject.id)">Delete</a>
      <img class="avatar" :src="selectedProject.avatar" :alt="selectedProject.username" width="122"/>
      <p><a v-bind:href="'https://github.com/' + selectedProject.username">@{{selectedProject.username}}</a> is hacking on:</p>
      <template v-if="!selectedProject.editMode">
        <h2>{{selectedProject.title}}</h2>
        <p class='selected-project-description'>{{selectedProject.description}}</p>
      </template>
      <template v-else>
        <input v-model="selectedProject.title" type="text" autofocus>
        <textarea v-model="selectedProject.description"></textarea>
        <button class="glow-button" @click="updateProject">Update</button>
      </template>
    </template>
</div>
</template>

<script>
  export default {
    name: 'right',
    props: ['selectedProject', 'username'],
    methods: {
      toggleEditMode () {
        this.$emit('toggleEditMode')
      },
      updateProject () {
        this.$emit('updateProject')
      },
      deleteComment (id) {
        this.$emit('deleteProject', id)
      }
    }
  }
</script>

<style>
</style>
