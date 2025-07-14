import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory('/pubmed/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    }
  ]
})

export default router 