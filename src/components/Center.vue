<template>
  <div class="center-column">
    <h1>{{mainThread.title}}</h1>
    <a class="help-icon">?<div class="help-text" v-html="mainThread.helpText"></div></a>
    <a class="account-status" v-if="username" @click="logout" v-cloak>{{username}} (Log out)</a>
    <a class="account-status" v-else @click="login" v-cloak>Log in</a>
    <div class="droptarget"
      @dragover="dragover"
      @drop="drop">
    <img src="../floorplan/learnhub.png" class="floorplan" />
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
    props: ['mainThread', 'username', 'projects', 'selectedProject', 'mapWidth', 'mapHeight'],
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
</style>
