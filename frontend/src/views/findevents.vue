<!-- This view displays a list of events. Users can search for events, and click on an event to be redirected to another component to view that event's details -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        List of Events
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <h2 class="text-2xl font-bold">Search Event By</h2>
        <!-- Displays Event Name or Event Date selection -->
        <div class="flex flex-col">
          <select
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy">
            <option value="Event Name">Event Name</option>
            <option value="Event Date">Event Date</option>
          </select>
        </div>
        <!--Displays event name search field-->
        <div class="flex flex-col" v-if="searchBy === 'Event Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="name" @keyup.enter="handleSubmitForm" placeholder="Enter event name" />
          </label>
        </div>
        <!-- Displays event date search field -->
        <div class="flex flex-col" v-if="searchBy === 'Event Date'">
          <input
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="date" v-model="eventDate" @keyup.enter="handleSubmitForm" />
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div></div>
        <div></div>
        <div class="mt-5 grid-cols-2">
          <!--Clear Search button-->
          <button class="mr-10 border border-red-700 bg-white text-red-700 rounded" @click="clearSearch" type="button">
            Clear Search
          </button>
          <!--Search Event button-->
          <button class="bg-red-700 text-white rounded" @click="handleSubmitForm" type="button">
            Search Event
          </button>
        </div>
      </div>
    </div>

    <hr class="mt-10 mb-10" />
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Events</h2>
        <h3 class="italic">Click table row to view event details</h3>
      </div>
      <div class="flex flex-col col-span-2">
        <!-- F3: three different states so the user always knows what is happening -->
        <!-- 1) Loading: shown while the request is in progress -->
        <p v-if="loading" class="p-4 text-gray-600 italic">Loading events...</p>
        <!-- 2) Error: shows the message from the API interceptor, plus a Retry button -->
        <div v-else-if="error" class="p-4 border border-red-300 bg-red-50 rounded">
          <p class="text-red-700 mb-3">{{ error }}</p>
          <button class="bg-red-700 text-white rounded" type="button" @click="retry">Retry</button>
        </div>
        <!-- 3) Data: the shared DataTable (it shows its own "No results" row when empty) -->
        <DataTable v-else :columns="columns" :rows="data || []" @row-click="openEvent" />
      </div>
    </div>
  </main>
</template>

<script setup>
// Composition API migration (Sprint 2):
// - data() -> ref() for each search field
// - mounted() -> onMounted()
// - methods -> plain functions
// - this.$router.push -> useRouter()
// - try/catch + toast in every method -> useApi() (gives data, loading, error)
// - copy-pasted <table> markup -> shared DataTable component (F3)
// - local formatDate() method -> shared formatDate from utils/
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getEvents, searchEvents } from '../api/api'
import { useApi } from '../composables/useApi'
// was: a formatDate() copy inside this file's methods
// Now uses the one shared formatDate from utils/
import { formatDate } from '../utils/formatDate'
import DataTable from '../components/DataTable.vue'

// was: this.$router (only works in the Options API)
// Now uses useRouter() to open the details page when a row is clicked
const router = useRouter()

// was: search fields listed inside data()
// Now each search field is its own ref(), bound to the inputs with v-model
const searchBy = ref('')
const name = ref('')
const eventDate = ref('')

// was: data() held 'events', and each method had its own try/catch + toast
// Now useApi gives us data, loading, and error for this page.
// execute(null) loads all events; execute(query) runs a search instead.
const { data, loading, error, execute } = useApi((query) =>
  query ? searchEvents(query) : getEvents()
)

// Remember the last request so Retry repeats exactly that one
// (a failed search retries the search, not the full list)
let lastQuery = null
// Runs a request and remembers it for Retry
function run(query) {
  lastQuery = query
  return execute(query)
}
// Called by the Retry button
function retry() {
  return execute(lastQuery)
}

// was: each column was hand-written <th>/<td> markup in the template
// Now: column setup for DataTable: label = header text, field = which property to show.
// The date column displays MM/DD/YYYY (render) but still sorts by the real date.
const columns = [
  { label: 'Event Name', field: 'name' },
  { label: 'Event Date', field: 'date', render: (e) => formatDate(e.date) },
  { label: 'Event Address', field: 'address.line1' }
]

// was: Clear Search called loadData() in methods
// Now: a plain function that empties the form and reloads the full list
function clearSearch() {
  searchBy.value = ''
  name.value = ''
  eventDate.value = ''
  run(null)
}

// was: handleSubmitForm() inside methods, with its own try/catch
// Now a plain function. Search button / Enter key: run the search that matches the dropdown choice.
// Does nothing if the search box is empty.
function handleSubmitForm() {
  if (searchBy.value === 'Event Name' && name.value) {
    run({ searchBy: 'name', name: name.value })
  } else if (searchBy.value === 'Event Date' && eventDate.value) {
    // the date input already gives YYYY-MM-DD, which is what the API expects
    run({ searchBy: 'date', eventDate: eventDate.value })
  }
}

// was: @click="$router.push(...)" written on each <tr>
// Now DataTable sends the clicked row up, and this function opens its details page
function openEvent(event) {
  router.push({ name: 'eventdetails', params: { id: event._id } })
}

// was: mounted() { this.loadData() }
// Now uses onMounted() to load all events when the page first opens
onMounted(() => run(null))
</script>
