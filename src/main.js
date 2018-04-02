// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Router from 'vue-router'
import App from './components/app'

Vue.config.productionTip = false
Vue.use(Router)

// html5 drag-and-drop support for mobile
import {polyfill} from 'mobile-drag-drop'
polyfill()

const router = new Router({
  base: window.location.pathname,
  routes: [
    {
      path: '/events/:issueNumber',
      name: 'history',
      component: App,
      props: true
    },
    {
      path: '*',
      name: 'latest',
      component: App
    }
  ]
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<router-view />'
})
