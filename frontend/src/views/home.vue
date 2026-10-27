<!-- This is the home view - which shows a dashboard -->
<template>
  <main>
    <div>
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        Dashboard
      </h1>
      <br />

      <!-- Events attendance section -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div class="ml-10"></div>
        <div class="flex flex-col col-span-2">
          <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
            Events Attendance
          </h1>

          <!-- Loading state -->
          <p v-if="attendanceLoading" class="mt-10 text-2xl font-bold text-center text-gray-500 animate-pulse">
            Loading events...
          </p>

          <!-- Error state with retry -->
          <div v-else-if="attendanceError" class="mt-10 bg-red-50 rounded shadow">
            <p class="p-4 text-lg font-bold text-red-900">{{ attendanceError }}</p>
            <div class="px-4 pb-4">
              <button class="bg-red-700 text-white rounded" @click="loadAttendance">Retry</button>
            </div>
          </div>

          <!-- Empty state -->
          <p v-else-if="!recentEvents.length" class="flex justify-center mt-10">
            No events in the last two months.
          </p>

          <!-- Data: table + chart -->
          <template v-else>
            <table class="min-w-full shadow-md rounded">
              <thead class="bg-gray-50 text-xl">
                <tr class="p-4 text-left">
                  <th class="p-4 text-left">Event Name</th>
                  <th class="p-4 text-left">Event Date</th>
                  <th class="p-4 text-left">Number of Attendees</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-300">
                <tr
                  v-for="event in recentEvents"
                  :key="event._id"
                  class="cursor-pointer hover:bg-gray-50"
                  @click="openEvent(event._id)"
                >
                  <td class="p-2 text-left">{{ event.name }}</td>
                  <td class="p-2 text-left">{{ formatDate(event.date) }}</td>
                  <td class="p-2 text-left">{{ event.attendees.length }}</td>
                </tr>
              </tbody>
            </table>
            <AttendanceChart :label="attendanceLabels" :chart-data="attendanceCounts" />
          </template>
        </div>
      </div>

      <!-- Clients by zip code section -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div class="ml-10"></div>
        <div class="flex flex-col col-span-2">
          <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
            Clients by Zip Code
          </h1>

          <!-- Loading state -->
          <p v-if="zipLoading" class="mt-10 text-2xl font-bold text-center text-gray-500 animate-pulse">
            Loading clients...
          </p>

          <!-- Error state with retry -->
          <div v-else-if="zipError" class="mt-10 bg-red-50 rounded shadow">
            <p class="p-4 text-lg font-bold text-red-900">{{ zipError }}</p>
            <div class="px-4 pb-4">
              <button class="bg-red-700 text-white rounded" @click="loadZips">Retry</button>
            </div>
          </div>

          <!-- Empty state -->
          <p v-else-if="!zips.length" class="flex justify-center mt-10">No clients found.</p>

          <!-- Data: table + chart -->
          <template v-else>
            <table class="min-w-full shadow-md rounded">
              <thead class="bg-gray-50 text-xl">
                <tr class="p-4 text-left">
                  <th class="p-4 text-left">Zip Number</th>
                  <th class="p-4 text-left">Client Count</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-300">
                <tr v-for="zip in zips" :key="zip._id">
                  <td class="p-2 text-left">{{ zip._id }}</td>
                  <td class="p-2 text-left">{{ zip.count }}</td>
                </tr>
              </tbody>
            </table>
            <div class="flex justify-center mt-10">
              <ZipChart :label="zipLabels" :chart-data="zipCounts" />
            </div>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
// Composition API migration (F1):
// - export default { components, data, mounted, methods } -> <script setup>
// - components: { AttendanceChart, ZipChart } -> plain imports (auto-registered)
// - data(): recentEvents, zips, loading, error, zipLoading, zipError
//     -> useApi() for each request (F2), which provides data / loading / error / execute
// - data(): labels, chartData, zipLabels, zipChartData -> computed() from the loaded data
// - mounted() -> onMounted()
// - methods.getAttendanceData / getZipData -> execute() from useApi, also used by Retry
// - methods.formatDate (local copy) -> shared import from utils/formatDate
// - was: each method had its own try/catch that turned errors into { title, message };
//   the Axios interceptor in api.js now does that in one place (F2)
// - Fixed: rows called editEvent(), which never existed; now openEvent() goes to event details
// - Fixed: loading/error messages were inside v-if="recentEvents.length", so they could
//   never show; the template now checks loading -> error -> empty -> data in that order
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AttendanceChart from '../components/barChart.vue'
import ZipChart from '../components/donutZipChart.vue'
import { getAttendance, getClientsByZipCode } from '../api/api'
import { useApi } from '../composables/useApi'
import { formatDate } from '../utils/formatDate'

const router = useRouter()

// Events from the last two months, for the attendance table and bar chart
const {
  data: attendanceData,
  loading: attendanceLoading,
  error: attendanceError,
  execute: loadAttendance
} = useApi(() => getAttendance())

// Client counts per zip code, for the zip table and doughnut chart
const {
  data: zipData,
  loading: zipLoading,
  error: zipError,
  execute: loadZips
} = useApi(() => getClientsByZipCode())

// was: data() arrays filled in by the methods; now derived from the API results
const recentEvents = computed(() => attendanceData.value ?? [])
const attendanceLabels = computed(() =>
  recentEvents.value.map((event) => `${event.name} (${formatDate(event.date)})`)
)
const attendanceCounts = computed(() =>
  recentEvents.value.map((event) => event.attendees.length)
)

const zips = computed(() => zipData.value ?? [])
const zipLabels = computed(() => zips.value.map((zip) => zip._id))
const zipCounts = computed(() => zips.value.map((zip) => zip.count))

// Clicking an event row opens that event's details page
function openEvent(id) {
  router.push({ name: 'eventdetails', params: { id } })
}

// was: mounted() { this.getAttendanceData(); this.getZipData() }
onMounted(() => {
  loadAttendance()
  loadZips()
})
</script>