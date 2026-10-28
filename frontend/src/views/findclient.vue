<!-- This view displays a list of clients. The user can search for clients, and click on a client to redirect to another component to view that client's information -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        Find Client
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <!--Search Client By selection-->
        <h2 class="text-2xl font-bold">Search Client By</h2>
        <div class="flex flex-col">
          <select
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy">
            <option value="Client Name">Client Name</option>
            <option value="Client Number">Client Number</option>
          </select>
        </div>
        <!--Input box for searching by Client First Name-->
        <div class="flex flex-col" v-if="searchBy === 'Client Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="firstName" @keyup.enter="handleSubmitForm" placeholder="Enter first name" />
          </label>
        </div>
        <!--Input box for searching by Client Last Name-->
        <div class="flex flex-col" v-if="searchBy === 'Client Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="lastName" @keyup.enter="handleSubmitForm" placeholder="Enter last name" />
          </label>
        </div>
        <!-- Displays Client Number search field -->
        <div class="flex flex-col" v-if="searchBy === 'Client Number'">
          <input
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="text" v-model="phoneNumber" @keyup.enter="handleSubmitForm"
            placeholder="Enter Client Phone Number" />
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
          <!--Search Client button-->
          <button class="bg-red-700 text-white rounded" @click="handleSubmitForm" type="button">
            Search Client
          </button>
        </div>
      </div>
    </div>

    <hr class="mt-10 mb-10" />
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Clients</h2>
        <h3 class="italic">Click table row to view client details</h3>
      </div>
      <div class="flex flex-col col-span-2">
        <!-- F3: three different states so the user always knows what is happening -->
        <!-- 1) Loading: shown while the request is in progress -->
        <p v-if="loading" class="p-4 text-gray-600 italic">Loading clients...</p>
        <!-- 2) Error: shows the message from the API interceptor, plus a Retry button -->
        <div v-else-if="error" class="p-4 border border-red-300 bg-red-50 rounded">
          <p class="text-red-700 mb-3">{{ error }}</p>
          <button class="bg-red-700 text-white rounded" type="button" @click="retry">Retry</button>
        </div>
        <!-- 3) Data: the shared DataTable (it shows its own "No results" row when empty) -->
        <DataTable v-else :columns="columns" :rows="data || []" @row-click="openClient" />
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getClients, searchClients } from '../api/api'
import { useApi } from '../composables/useApi'
import DataTable from '../components/DataTable.vue'

// was: this.$router (only works in the Options API)
// Now uses useRouter() to open the details page when a row is clicked
const router = useRouter()

// was: search fields listed inside data()
// Now each search field is its own ref(), bound to the inputs with v-model
const searchBy = ref('')
const firstName = ref('')
const lastName = ref('')
const phoneNumber = ref('')

// was: data() held 'clients', and each method had its own try/catch + toast
// Now useApi gives us data, loading, and error for this page.
// execute(null) loads all clients; execute(query) runs a search instead.
const { data, loading, error, execute } = useApi((query) =>
  query ? searchClients(query) : getClients()
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
// Now: column setup for DataTable: label = header text, field = which property to show
const columns = [
  // Name shows first + last, but sorts by first name
  { label: 'Name', field: 'firstName', render: (c) => `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() },
  { label: 'Phone number', field: 'phoneNumber.primary' },
  { label: 'City', field: 'address.city' }
]

// was: Clear Search called loadData() in methods
// Now: a plain function that empties the form and reloads the full list
function clearSearch() {
  searchBy.value = ''
  firstName.value = ''
  lastName.value = ''
  phoneNumber.value = ''
  run(null)
}

// was: handleSubmitForm() inside methods, with its own try/catch
// Now a plain function. Search button / Enter key: run the search that matches the dropdown choice.
// Does nothing if the search box is empty.
function handleSubmitForm() {
  if (searchBy.value === 'Client Name' && (firstName.value || lastName.value)) {
    run({ searchBy: 'name', firstName: firstName.value, lastName: lastName.value })
  } else if (searchBy.value === 'Client Number' && phoneNumber.value) {
    run({ searchBy: 'number', phoneNumber: phoneNumber.value })
  }
}

// was: @click="$router.push(...)" written on each <tr>
// Now DataTable sends the clicked row up, and this function opens its details page
function openClient(client) {
  router.push({ name: 'clientdetails', params: { id: client._id } })
}

// was: mounted() { this.loadData() }
// Now uses onMounted() to load all clients when the page first opens
onMounted(() => run(null))
</script>
