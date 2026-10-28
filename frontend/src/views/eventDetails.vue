<!-- This component allows a user to update a specific event's information. -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        Event Details
      </h1>
    </div>
    <div class="px-10 py-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <h2 class="text-2xl font-bold">Event Details</h2>
        <!-- Event Name input field -->
        <div class="flex flex-col">
          <label class="block">
            <span class="text-gray-700">Event Name</span>
            <span style="color: #ff0000">*</span>
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="event.name" />
            <span v-if="v$.event.name.$error" class="text-red-500">
              Event Name is required
            </span>
          </label>
        </div>

        <!-- Date input field -->
        <div class="flex flex-col">
          <label class="block">
            <span class="text-gray-700">Date</span>
            <span style="color: #ff0000">*</span>
            <input type="date"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="event.date" />
            <span v-if="v$.event.date.$error" class="text-red-500">
              <span v-if="v$.event.date.required.$invalid">
                Event Date is required
              </span>
              <span v-else-if="!v$.event.date.required.$invalid && v$.event.date.validDate.$invalid">
                Event Date must be a valid date
              </span>
            </span>
          </label>
        </div>

        <div></div>
        <div></div>
        <!-- Description input field -->
        <div class="flex flex-col">
          <label class="block">
            <span class="text-gray-700">Description</span>
            <textarea
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows="2" v-model="event.description"></textarea>
          </label>
        </div>
      </div>

      <!-- Services Offered at Event checkboxes -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 mt-10">
        <h2 class="text-2xl font-bold">Services Offered at Event</h2>
        <div class="flex flex-col grid-cols-3">
          <div>
            <ul v-if="services.length" class="space-y-2">
              <li v-for="service in services" :key="service._id" :data-service-id="service._id"
                class="rounded-lg border border-gray-300 p-2 hover:bg-gray-100 transition-colors relative">
                <label class="block w-full h-full">
                  <input type="checkbox" :id="service._id" :value="service._id"
                    :checked="event.services.includes(service._id)" v-model="event.services"
                    :disabled="service.status === 'Inactive'"
                    class="rounded border-gray-300 disabled:opacity-50 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50 mr-2">
                  <span class="font-medium">{{ service.name }}</span>
                </label>
              </li>
            </ul>
            <!--If there are no active services for the user's organization, this will appear instead of list of checkboxes-->
            <p v-else class="text-gray-600">No Active Services Available</p>
          </div>
        </div>
      </div>

      <!-- grid container -->
      <div class="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <h2 class="text-2xl font-bold">Address</h2>
        <!-- Address 1 input field -->
        <div class="flex flex-col">
          <label class="block">
            <span class="text-gray-700">Address Line 1</span>
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder v-model="event.address.line1" />
          </label>
        </div>
        <!-- Address 2 input field -->
        <div class="flex flex-col">
          <label class="block">
            <span class="text-gray-700">Address Line 2</span>
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder v-model="event.address.line2" />
          </label>
        </div>
        <!-- City input field -->
        <div class="flex flex-col">
          <label class="block">
            <span class="text-gray-700">City</span>
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder v-model="event.address.city" />
          </label>
        </div>
        <div></div>
        <!-- County input field -->
        <div class="flex flex-col">
          <label class="block">
            <span class="text-gray-700">County</span>
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder v-model="event.address.county" />
          </label>
        </div>
        <!-- Zip Code input field -->
        <div class="flex flex-col">
          <label class="block">
            <span class="text-gray-700">Zip Code</span>
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder v-model="event.address.zip" />
          </label>
        </div>
      </div>

      <!-- grid container -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div></div>
        <!--Update Event button-->
        <div class="flex justify-between mt-10 mr-20">
          <button @click="submitEventUpdate" type="submit" class="bg-green-700 disabled:opacity-50 text-white rounded"
            :disabled="user.role !== 'editor'">
            Update Event
          </button>
        </div>
        <!--Delete Event button-->
        <div class="flex justify-between mt-10 mr-20">
          <button @click="submitDeleteEvent" type="submit" class="bg-red-700  disabled:opacity-50 text-white rounded"
            :disabled="user.role !== 'editor'">
            Delete Event
          </button>
          <!--Go back button-->
        </div>
        <div class="flex justify-between mt-10 mr-20">
          <button type="reset" class="border border-red-700 bg-white text-red-700 rounded" @click="router.back()">
            Go back
          </button>
        </div>
      </div>

      <hr class="mt-10 mb-10" />

      <!-- grid container -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div>
          <h2 class="text-2xl font-bold">List of Attendees</h2>
          <h3 class="italic">Click table row to view client details</h3>
        </div>
        <!--Table showing the list of attendees for the selected event-->
        <div class="flex flex-col col-span-2">
          <table class="min-w-full shadow-md rounded">
            <thead class="bg-gray-50 text-xl">
              <tr>
                <th class="p-4 text-left">Name</th>
                <th class="p-4 text-left">City</th>
                <th class="p-4 text-left">Phone Number</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-300">
              <tr @click="$router.push({name: 'clientdetails', params: { id: client._id } })" 
              v-for="client in clients" :key="client._id" class="cursor-pointer"
                :class="{ 'hoverRow': hoverId === client._id }" @mouseenter="hoverId = client._id"
                @mouseleave="hoverId = null">
                <td class="p-2 text-left">
                  {{ client.firstName + ' ' + client.lastName }}
                </td>
                <td class="p-2 text-left">{{ client.address.city }}</td>
                <td class="p-2 text-left">
                  {{ client.phoneNumber.primary }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</template>


<script setup>

 // Composition API migration (F1):
 // - Options API data() → reactive() and ref() state
 // - Options API lifecycle hooks → Composition API hooks
 // - methods → plain functions
 // - this.$router / this.$route → useRouter() / useRoute()
 // - Options API validations → useVuelidate()

import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useVuelidate from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { useLoggedInUserStore } from '../store/loggedInUser'
import {
  getEventById,
  getEventAttendees,
  getServices,
  updateEvent,
  deleteEvent
} from '../api/api'
import { useToast } from 'vue-toastification'

// Router, notifications, and logged-in user
const route = useRoute()
const router = useRouter()
const toast = useToast()
const user = useLoggedInUserStore()

// Attendees and services for the selected event
const clients = ref([])
const services = ref([])
const hoverId = ref(null)

// Event information
const event = reactive({
  name: null,
  description: null,
  date: null,
  address: {
    line1: null,
    line2: null,
    city: null,
    county: null,
    zip: null
  },
  attendees: [],
  services: []
})

// Validate event date
const validDate = (value) => {
  if (!value) return false

  const date = new Date(`${value}T00:00:00`)

  return !isNaN(date.getTime()) &&
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getDate() === Number(value.slice(8, 10))
}

// Validation rules
const rules = {
  event: {
    name: { required },
    date: {
      required,
      validDate
    }
  }
}

 // was: validations() in Options API
 // Now uses a rules object with useVuelidate()
 const v$ = useVuelidate(rules, { event })



 // was: data loading handled by an Options API lifecycle hook
 // Now uses onMounted() to load event, attendee, and service information
 onMounted(async () => {
  try {
    const [eventResponse, clientsResponse, servicesResponse] =
      await Promise.all([
        getEventById(route.params.id),
        getEventAttendees(route.params.id),
        getServices()
      ])

    // Convert the event date to YYYY-MM-DD for the HTML date input
    const eventDate = eventResponse.date
    const formattedDate = eventDate
      ? new Date(eventDate).toISOString().substring(0, 10)
      : null

    Object.assign(event, {
      ...eventResponse,
      date: formattedDate,
      address: {
        line1: null,
        line2: null,
        city: null,
        county: null,
        zip: null,
        ...(eventResponse.address || {})
      },
      services: Array.isArray(eventResponse.services)
        ? eventResponse.services.map(service =>
            typeof service === 'object' ? service._id : service
          )
        : [],
      attendees: eventResponse.attendees || []
    })

    clients.value = clientsResponse
    services.value = servicesResponse
  } catch (error) {
    console.error('Error loading event details:', error)
    toast.error('Error loading event details')
  }
})

// Update event
const submitEventUpdate = async () => {
  if (user.role !== 'editor') return

  const isValid = await v$.value.$validate()

  if (!isValid) {
    toast.error('Please fix input field errors')
    return
  }

  try {
     // was: event update logic inside an Options API method
     // Now uses a plain function that calls the imported updateEvent() API function
    const response = await updateEvent(route.params.id, event)

    toast.success(
      typeof response === 'string'
        ? response
        : 'Event updated successfully'
    )

    await router.push('/findevents')
  } catch (error) {
    console.error('Error updating event:', error)
    toast.error('Error updating event')
  }
}

// Delete event if it has no attendees
const submitDeleteEvent = async () => {
  if (user.role !== 'editor') return

  const attendeeCount = Array.isArray(event.attendees)
    ? event.attendees.length
    : Number(event.attendees) || 0

  if (attendeeCount > 0 || clients.value.length > 0) {
    toast.info('Event cannot be deleted since it has attendees.')
    return
  }

  try {
    const response = await deleteEvent(route.params.id)

    toast.success(
      typeof response === 'string'
        ? response
        : 'Event deleted successfully'
    )

    await router.push('/findevents')
  } catch (error) {
    console.error('Error deleting event:', error)
    toast.error('Error deleting event')
  }
}
</script>

