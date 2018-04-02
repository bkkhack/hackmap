<template>
  <div class="center-column" @click="closeModals">
    <div class="droptarget"
        @dragenter="dragevent"
        @dragover="dragevent"
        @drop="drop">
      <img class="floorplan"
        v-bind:src="floorplan.url" />
      <img class="marker" width="36"
        v-for="project in projects"
        v-if="project.x > 0 && project.y > 0 && floorplan.width > 0 && floorplan.height > 0"
        v-bind:key="project.id"
        v-bind:draggable="project.username === user.username || user.isAdmin"
        @dragstart="drag"
        @click.stop="updateSelectedProject(project.id)"
        v-bind:class="{ selected: selectedProjectId === project.id }"
        v-bind:data-id="project.id"
        v-bind:style="{ left: floorplan.width * project.x - 20 + 'px', top: floorplan.height * project.y - 20 + 'px' }"
        v-bind:src="project.avatar_thumbnail"
        v-bind:alt="project.username"
        v-bind:title="project.title" />
    </div>
  </div>
</template>

<script>
  export default {
    name: 'hack-map',
    props: ['mainThread', 'user', 'projects', 'selectedProjectId', 'floorplan'],
    methods: {
      dragevent (event) {
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
      updateSelectedProject (projectId) {
        this.$emit('updateSelectedProject', projectId)
      },
      closeModals () {
        this.$emit('closeModals')
      }
    }
}
</script>

<style>
  .center-column {
    padding:40px;
    max-height:100%; /* seems required for firefox to appropriately scale tall hackmap images */
  }
  .droptarget {
    width:90%;
    max-width:600px;
    position:relative;
    margin:0 auto 0 auto;
  }
  .floorplan {
    /* floorplan image is assumed to be black vector image */
    filter:invert(100%) opacity(40%);
    z-index:0;
    width:100%;
    user-select:none;
  }
  .marker {
    position:absolute;
    z-index:1;
    transition: box-shadow 100ms ease-in-out;
    box-shadow: 0 0 0 0 #3a7be2;
    user-select:none;
  }
  .marker.selected {
    animation: pulse 0.8s 3;
    box-shadow: 0 0 5px 3px #3a7be2;
  }
  @keyframes pulse {
    from {
      transform: scale3d(1, 1, 1);
    }

    50% {
      transform: scale3d(1.2, 1.2, 1.2);
    }

    to {
      transform: scale3d(1, 1, 1);
    }
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
