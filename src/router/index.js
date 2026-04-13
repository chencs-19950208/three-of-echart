import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/homepage',
    name: 'Homepage',
    component: () => import('@/views/Homepage.vue')
  },
  {
    path: '/charts',
    name: 'Charts',
    component: () => import('@/views/Charts.vue')
  },
  {
    path: '/three',
    name: 'ThreeScene',
    component: () => import('@/views/ThreeScene.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue')
  },
  {
    path: '/tree-home',
    name: 'ThreeHome',
    component: () => import('@/views/testHome.vue')
  },
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
