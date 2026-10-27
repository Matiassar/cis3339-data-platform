import { createRouter, createWebHistory } from 'vue-router'
import { useLoggedInUserStore } from '../store/loggedInUser'

// Make all paths and names lowercase for consistency
const routes = [
  {
    path: '/',
    component: () => import('../views/home.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login.vue')
  },
  {
    path: '/clientform',
    name: 'clientform',
    // Only editors can create clients
    meta: {
      requiresAuth: true,
      requiresEditor: true
    },
    component: () => import('../views/clientform.vue')
  },
  {
    path: '/findclient',
    name: 'findclient',
    meta: { requiresAuth: true },
    component: () => import('../views/findclient.vue')
  },
  {
    path: '/clientdetails/:id',
    name: 'clientdetails',
    meta: { requiresAuth: true },
    component: () => import('../views/clientdetails.vue')
  },
  {
    path: '/eventform',
    name: 'eventform',
    // Only editors can create events
    meta: {
      requiresAuth: true,
      requiresEditor: true
    },
    component: () => import('../views/eventform.vue')
  },
  {
    path: '/findevents',
    name: 'findevents',
    meta: { requiresAuth: true },
    component: () => import('../views/findevents.vue')
  },
  {
    path: '/eventdetails/:id',
    name: 'eventdetails',
    meta: { requiresAuth: true },
    component: () => import('../views/eventDetails.vue')
  },
  {
    path: '/serviceform',
    name: 'serviceform',
    // Only editors can create services
    meta: {
      requiresAuth: true,
      requiresEditor: true
    },
    component: () => import('../views/serviceform.vue')
  },
  {
    path: '/findservice',
    name: 'findservice',
    meta: { requiresAuth: true },
    component: () => import('../views/findservice.vue')
  },
  {
    path: '/servicedetails/:id',
    name: 'servicedetails',
    meta: { requiresAuth: true },
    component: () => import('../views/servicedetails.vue')
  }
]

// Create Vue Router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Protect authenticated and editor-only routes
router.beforeEach((to) => {
  const store = useLoggedInUserStore()

  // Check whether the user is logged in
  if (
    (to.meta.requiresAuth || to.meta.requiresEditor) &&
    !store.isLoggedIn
  ) {
    return {
      path: '/login',
      // Save the requested page for after login
      query: {
        redirect: to.fullPath
      }
    }
  }

  // Check whether the user has editor permissions
  if (
    to.meta.requiresEditor &&
    store.role !== 'editor'
  ) {
    // Viewers cannot access editor-only pages
    return {
      path: '/'
    }
  }

  // Allow navigation
  return true
})

export default router