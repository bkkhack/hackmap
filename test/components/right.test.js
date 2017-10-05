import Vue from 'vue'
import RightComponent from '../../src/components/Right.vue'

function mount(Component, props) {
  const Constructor = Vue.extend(Component)
  const component = new Constructor({ propsData: props }).$mount()
  return component
}

describe('RightComponent', () => {
  let props;

  beforeEach(function() {
    props = {
      selectedProject: {
        id: 1,
        title: 'Doomsday Device',
        description: 'Time to take over the world!',
        username: 'Dr_Horrible'
      },
      username: 'Dr_Horrible'
    }
  })

  it('shows the edit button when the selected project belongs to the logged-in user', () => {
    props.selectedProject.username = "Dr_Horrible"
    props.username = "Dr_Horrible"

    const sidebar = mount(RightComponent, props)

    const editButton = sidebar.$el.querySelector(".edit-button")
    expect(editButton).not.toBeNull()
  })

  it('hides the edit button when the selected project does not belong to the logged-in user', () => {
    props.selectedProject.username = "Dr_Horrible"
    props.username = "Captain_Hammer"

    const sidebar = mount(RightComponent, props)

    const editButton = sidebar.$el.querySelector(".edit-button")
    expect(editButton).toBeNull()
  })
})

