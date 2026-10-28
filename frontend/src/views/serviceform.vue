<!-- This view allows for the creation of a new service -->
<template>
    <main>
        <!--Header-->
        <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
            Create Service
        </h1>
        <div class="px-10 py-20">
            <!--Form-->
            <!-- @submit.prevent stops the submit event from reloading the page-->
            <form @submit.prevent="handleSubmitForm">
                <!-- grid container -->
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
                    <h2 class="text-2xl font-bold">Service Details</h2>
                    <!-- Service Name input field -->
                    <div class="flex flex-col">
                        <label class="block">
                            <span class="text-gray-700">Service Name</span>
                            <span style="color: #ff0000">*</span>
                            <input type="text"
                                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                v-model="service.name" />
                            <!-- Validation error messages -->
                            <span v-if="v$.service.name.$error" class="text-red-500">
                                Service Name is required
                            </span>
                        </label>
                    </div>

                    <!-- Description input field -->
                    <div class="flex flex-col">
                        <label>
                            <span class="text-gray-700">Description:</span>
                            <textarea
                                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                v-model="service.description"></textarea>
                        </label>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 mt-10">
                    <div></div>
                    <!-- form field: update service description -->
                    <div class="flex flex-col">
                        <label class="block">
                        <span class="text-gray-700">Service Status</span>
                        <span style="color: #ff0000">*</span>
                        <div class="mt-1">
                            <label class="inline-flex items-center">
                                <input type="radio" class="form-radio" value="Active"
                                    v-model="service.status">
                                <span class="ml-2">Active</span>
                            </label>
                            <label class="inline-flex items-center ml-6">
                                <input type="radio" class="form-radio" value="Inactive"
                                    v-model="service.status">
                                <span class="ml-2">Inactive</span>
                            </label>
                        </div>
                    </label>
                    </div>
                </div>

                <!-- grid container -->
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
                    <div></div>
                    <!-- Add Service submit button -->
                    <div class="flex justify-between mt-10 mr-20">
                        <button class="bg-red-700 text-white rounded" type="submit">
                            Add Service
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </main>
</template>

<script setup>
// This view allows for the creation of a new service.
//
// Composition API migration (Sprint 2):
// - data() -> reactive(service)
// - setup() + validations() -> rules object passed to useVuelidate()
// - methods -> plain functions
// - this.$router -> useRouter()
// - this.v$ -> v$.value
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import useVuelidate from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { createService } from '../api/api'
import { useToast } from 'vue-toastification'

// Toast pop-up notifications
const toast = useToast()
// was: this.$router
// Now uses useRouter() to go back to the service list after saving
const router = useRouter()

// was: service object inside data()
// Now uses reactive() so the form inputs (v-model) stay in sync
const service = reactive({
  name: null,
  description: null,
  status: 'Active'
})

// was: validations() in the Options API
// Now a plain rules object: service name is required (same rule as before)
const rules = {
  service: {
    name: { required }
  }
}
// was: useVuelidate() called inside setup() with no arguments
// Now passes the rules and state directly; the template still uses v$.service.name.$error
const v$ = useVuelidate(rules, { service })

// was: handleSubmitForm() inside methods, using this.v$ and this.service
// Now a plain async function, called when the user submits the form
async function handleSubmitForm() {
  // Check the form; shows the red error message if the name is empty
  const isValid = await v$.value.$validate()
  if (!isValid) return // form is invalid, do not proceed

  try {
    // Send the new service to the backend
    const response = await createService(service)
    // The backend replies with a success message string
    toast.success(typeof response === 'string' ? response : 'Service created')
    // Go back to the service list
    router.push('/findservice')
  } catch (error) {
    // error.message is a readable string from the API interceptor
    toast.error(error.message)
  }
}
</script>
