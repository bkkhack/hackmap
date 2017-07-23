<template>
  <div class="details side-column">
    <template v-if="selectedProject.id" v-cloak>
      <a class="edit-button" v-if="selectedProject.username === username" v-on:click="toggleEditMode">{{selectedProject.editMode ? "X" : "Edit"}}</a>
      <img class="avatar"
        v-bind:src="selectedProject.avatar"
        v-bind:alt="selectedProject.username" />
      <p><a v-bind:href="'https://github.com/' + selectedProject.username">@{{selectedProject.username}}</a> is hacking on:</p>
      <template v-if="!selectedProject.editMode">
        <h2>{{selectedProject.title}}</h2>
        <p class='selected-project-description'>{{selectedProject.description}}</p>
      </template>
      <template v-else>
        <input v-model="selectedProject.title" type="text" autofocus>
        <textarea v-model="selectedProject.description"></textarea>
        <button class="glow-button" v-on:click="updateProject">Update</button>
      </template>
    </template>
</div>
</template>

<script>
  export default {
    name: 'right',
    props: ['selectedProject', 'username']
  }
</script>

<style>
</style>
