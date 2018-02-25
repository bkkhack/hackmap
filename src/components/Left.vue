<template>
  <div class="projects side-column">
    <div class="project-form" v-bind:class="{ open: form.isOpen }">
      <input v-model="form.title" type="text" placeholder="Topic" autofocus>
      <textarea v-model="form.descriptionText" placeholder="Details (optional, uses markdown)"></textarea>
    </div>

    <button v-if="userAlreadyHasProject" disabled="true" class="glow-button disabled" title="You've already added a hack!" @click="toggleForm">+ Add your hack</button>
    <button v-else class="glow-button" @click="toggleForm">+ Add your hack</button>

    <div v-for="project in projects"
      @dragstart="drag"
      @click="updateSelectedProject(project)"
      v-bind:key="project.id"
      v-bind:data-id="project.id"
      v-bind:class="{ selected: selectedProject === project }"
      v-bind:draggable="project.username === username"
      v-cloak
      class="project">
    <img v-bind:src="project.avatar_thumbnail" width="36" v-bind:alt="project.username" draggable="false" />
    {{project.title}}
    </div>
    <div class="details" v-if="state === 'running' && projects.length === 0">
      <p>No hacks yet, you can be the first!</p>
    </div>
    <div class="loader" v-if="state === 'init'">
      <div class="loader1"></div>
      <div class="loader2"></div>
      <div class="loader3"></div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'left',
    props: ['form', 'projects', 'selectedProject', 'username', 'userAlreadyHasProject', 'state'],
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
    border: 2px dashed #6384b7;
    color: #6384b7;
    cursor: default;
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
  .details {
    text-align:center;
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
</style>
