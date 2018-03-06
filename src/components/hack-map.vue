<template>
  <div class="center-column" @click="closeModals">
    <img class="floorplan"
      v-bind:src="floorplan.url"
      ref="floorplanElement"
      @dragenter="dragevent"
      @dragover="dragevent"
      @drop="drop" />
    <img class="marker" width="36"
      v-for="project in projects"
      v-if="project.x > 0 && project.y > 0 && floorplan.width > 0 && floorplan.height > 0"
      v-bind:key="project.id"
      v-bind:draggable="project.username === user.username"
      @dragstart="drag"
      @click.stop="updateSelectedProject(project.id)"
      v-bind:class="{ selected: selectedProjectId === project.id }"
      v-bind:data-id="project.id"
      v-bind:style="calculatePosition(project)"
      v-bind:src="project.avatar_thumbnail"
      v-bind:alt="project.username"
      v-bind:title="project.title" />
    </div>
    </div>
</div>
</template>

<script>
  export default {
    name: 'hack-map',
    props: ['mainThread', 'user', 'projects', 'selectedProjectId', 'floorplan'],
    methods: {
      calculatePosition (project) {
        var el = this.$refs.floorplanElement.getBoundingClientRect()
        return {
          left: el.x + this.floorplan.width * project.x - 20 + 'px',
          top: el.y + this.floorplan.height * project.y - 20 + 'px'
        }
      },
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
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.updateMapDimensions)
    }
}
</script>

<style>
  .center-column {
    padding:40px;
    max-height:100%; /* seems required for firefox to appropriately scale tall hackmap images */
  }
  .floorplan {
    /* floorplan image is assumed to be black vector image */
    filter:invert(100%) opacity(40%);
    z-index:0;
    max-width: 100%;
    max-height: 100%;
    margin: 0 auto;
    display: block;
    user-select:none;
  }
  .marker {
    position:absolute;
    z-index:1;
    transition: box-shadow 100ms ease-in-out;
    box-shadow: 0 0 0 0 #3a7be2;
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
