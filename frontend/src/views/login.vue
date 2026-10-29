<!-- Login view -->
<template>
  <div>
    <!-- Header -->
    <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
      Welcome
    </h1>

    <!-- Login Form -->
    <form @submit.prevent="handleLogin" novalidate>
      <div class="flex justify-center mt-10">
        <label>
          <span class="text-gray-700">Username</span>
          <span style="color: #ff0000">*</span>

          <input
            type="text"
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="Username"
            v-model="username"
            autocomplete="username"
          />
        </label>
      </div>

      <div class="flex justify-center mt-10">
        <label>
          <span class="text-gray-700">Password</span>
          <span style="color: #ff0000">*</span>

          <input
            type="password"
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="Password"
            v-model="password"
            autocomplete="current-password"
          />
        </label>
      </div>

      <!-- Login Button -->
      <div class="flex justify-center mt-10">
        <button
          class="bg-red-700 text-white rounded"
          type="submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Logging in...' : 'Login' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
// Composition API migration (F1):
// - export default { data, setup } -> <script setup>
// - data() { username, password } -> ref('') for each field
// - setup() { return { store } } -> const store = useLoggedInUserStore() at top level
// - was: @submit called store.login(username, password) directly in the template;
//   now handleLogin() passes the ?redirect= page so users return where they started (F4)
// - NEW: isSubmitting ref disables the button while logging in (prevents double submits)
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useLoggedInUserStore } from '../store/loggedInUser'

// Access Pinia store and current route
const store = useLoggedInUserStore()
const route = useRoute()

// Form inputs
const username = ref('')
const password = ref('')
const isSubmitting = ref(false)

// Handle login submission
async function handleLogin() {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    // Retrieve the originally requested destination
    const redirect = route.query.redirect

    const destination =
      typeof redirect === 'string'
        ? redirect
        : '/'

    // Login and navigate to the requested page
    await store.login(
      username.value,
      password.value,
      destination
    )
  } finally {
    isSubmitting.value = false
  }
}
</script>