import Vue from 'vue'
import SideBarComponent from '../../src/components/side-bar.vue'

function mount(Component, props) {
  const Constructor = Vue.extend(Component)
  const component = new Constructor({ propsData: props }).$mount()
  return component
}

describe('SideBarComponent', () => {
  let props;

  beforeEach(function() {
    props = {
      projects:[
        {
          id: 0,
          title: 'Save the world',
          description: 'Fight Dr. Horrible!',
          username: 'Captain_Hammer'
        },
        {
          id: 1,
          title: 'Doomsday Device',
          description: 'Time to take over the world!',
          username: 'Dr_Horrible'
        }
      ],
      selectedProjectId: 1,
      user: {
        username: 'Dr_Horrible'
      },
      form: {}
    }
  })

  it('shows the edit button when the selected project belongs to the logged-in user', () => {
    props.selectedProjectId = 1
    props.user.username = "Dr_Horrible"

    const sidebar = mount(SideBarComponent, props)

    const editButton = sidebar.$el.querySelector('.edit.action-button')
    expect(editButton).not.toBeNull()
  })

  it('hides the edit button when the selected project does not belong to the logged-in user', () => {
    props.selectedProjectId = 1
    props.user.username = "Captain_Hammer"

    const sidebar = mount(SideBarComponent, props)

    const editButton = sidebar.$el.querySelector('.edit.action-button')
    expect(editButton).toBeNull()
  })
})

