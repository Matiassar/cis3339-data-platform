<!-- Main application layout and navigation -->

<template>
  <main class="flex flex-row">
    <div id="_container" class="min-h-screen">
      <header class="w-full">

        <!-- Organization Logo -->
        <section class="text-center">
          <img
            class="m-auto"
            src="@/assets/DanPersona.svg"
            alt="Data Platform organization logo"
          />
        </section>

        <!-- Navigation Bar -->
        <nav class="mt-10">
          <ul class="flex flex-col gap-4">

            <!-- Dashboard -->
            <li>
              <router-link to="/">
                <span
                  style="position: relative; top: 6px"
                  class="material-icons"
                >
                  dashboard
                </span>
                Dashboard
              </router-link>
            </li>

            <!-- Login: Only visible when logged out -->
            <li v-if="!user.isLoggedIn">
              <router-link to="/login">
                <span
                  style="position: relative; top: 6px"
                  class="material-icons"
                >
                  login
                </span>
                Login
              </router-link>
            </li>

            <!-- Logout: Only visible when logged in -->
            <li v-if="user.isLoggedIn">
              <button
                type="button"
                @click="user.logout()"
                class="cursor-pointer text-left"
              >
                <span
                  style="position: relative; top: 6px"
                  class="material-icons"
                >
                  logout
                </span>
                Logout
              </button>
            </li>

            <!-- Client Intake Form: Editors Only -->
            <li v-if="user.isLoggedIn && user.role === 'editor'">
              <router-link to="/clientform">
                <span
                  style="position: relative; top: 6px"
                  class="material-icons"
                >
                  people
                </span>
                Client Intake Form
              </router-link>
            </li>

            <!-- Create Event: Editors Only -->
            <li v-if="user.isLoggedIn && user.role === 'editor'">
              <router-link to="/eventform">
                <span
                  style="position: relative; top: 6px"
                  class="material-icons"
                >
                  event
                </span>
                Create Event
              </router-link>
            </li>

            <!-- Create Service: Editors Only -->
            <li v-if="user.isLoggedIn && user.role === 'editor'">
              <router-link to="/serviceform">
                <span
                  style="position: relative; top: 6px"
                  class="material-icons"
                >
                  volunteer_activism
                </span>
                Create Service
              </router-link>
            </li>

            <!-- Find Client: All Logged-In Users -->
            <li v-if="user.isLoggedIn">
              <router-link to="/findclient">
                <span
                  style="position: relative; top: 6px"
                  class="material-icons"
                >
                  search
                </span>
                Find Client
              </router-link>
            </li>

            <!-- Find Event: All Logged-In Users -->
            <li v-if="user.isLoggedIn">
              <router-link to="/findevents">
                <span
                  style="position: relative; top: 6px"
                  class="material-icons"
                >
                  search
                </span>
                Find Event
              </router-link>
            </li>

            <!-- Find Service: All Logged-In Users -->
            <li v-if="user.isLoggedIn">
              <router-link to="/findservice">
                <span
                  style="position: relative; top: 6px"
                  class="material-icons"
                >
                  search
                </span>
                Find Service
              </router-link>
            </li>

          </ul>
        </nav>
      </header>
    </div>

    <!-- Main Content -->
    <div class="grow w-4/5">

      <!-- Organization Name Header -->
      <section
        class="justify-end items-center h-24 flex"
        style="background: linear-gradient(250deg, #c8102e 70%, #efecec 50.6%)"
      >
        <h1 class="mr-20 text-3xl text-white">
          {{ orgName }}
        </h1>
      </section>

      <!-- Page Content -->
      <div>
        <router-view></router-view>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLoggedInUserStore } from './store/loggedInUser'
import { getOrgName } from './api/api'

// Access the logged-in user's Pinia store
const user = useLoggedInUserStore()

// Organization name
const orgName = ref('Dataplatform')

// Load the organization name when the application mounts
onMounted(async () => {
  try {
    const name = await getOrgName()

    if (name) {
      orgName.value = name
    }
  } catch (error) {
    console.error('Failed to load organization name:', error)
  }
})
</script>

<style scoped>
#_container {
  background-color: #c8102e;
  color: white;
  padding: 18px;
}
</style>