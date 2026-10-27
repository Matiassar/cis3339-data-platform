<!-- This view allows a user to create a client, or to pick an existing client from the dropdown to edit or delete it. -->
<template>
  <main>
    <!--Header-->
    <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
      {{ isEdit ? 'Edit Client' : 'Client Intake Form' }}
    </h1>
    <div class="px-10 py-20">
      <!-- form field -->
      <!-- @submit.prevent stops the submit event from reloading the page-->
      <form novalidate @submit.prevent="submitForm">
        <!-- Pick an existing client to edit/delete, or leave on "New client" to create one -->
        <div class="mb-10 max-w-md">
          <label class="block">
            <span class="text-gray-700">Select a client to edit or delete</span>
            <select v-model="editingId" @change="onPickClient"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
              <option value="">New client</option>
              <option v-for="c in clients" :key="c._id" :value="c._id">
                {{ c.firstName }} {{ c.lastName }} ({{ c.phoneNumber?.primary }})
              </option>
            </select>
          </label>
        </div>
        <!-- grid container -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          <h2 class="text-2xl font-bold">Personal Details</h2>
          <!--First Name Input Field-->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">First Name</span>
              <span style="color: #ff0000">*</span>
              <input type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="client.firstName" />
            </label>
            <!-- Validation error messages -->
            <span v-if="v$.client.firstName.$error" class="text-red-500">
              First Name is required
            </span>
          </div>

          <!--Middle Name Input Field-->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Middle Name</span>
              <input type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder v-model="client.middleName" />
            </label>
          </div>

          <!--Last Name Input Field-->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Last Name</span>
              <span style="color: #ff0000">*</span>
              <input type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder v-model="client.lastName" />
            </label>
            <!-- Validation error messages -->
            <span v-if="v$.client.lastName.$error" class="text-red-500">
              Last Name is required
            </span>
          </div>

          <div></div>
          <!--Email Input Field-->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Email</span>
              <span style="color: #ff0000">*</span>
              <input type="email"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="client.email" />
            </label>
            <!-- Validation error messages -->
            <span v-if="v$.client.email.$error" class="text-red-500">
              Valid Email is required
            </span>
          </div>
          <!-- Phone Number Input Field -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Phone Number</span>
              <span style="color: #ff0000">*</span>
              <input type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                pattern="[0-9]{3}[0-9]{3}[0-9]{4}" v-model="client.phoneNumber.primary" />
            </label>
            <!-- Validation error messages -->
            <span v-if="v$.client.phoneNumber.primary.$error" class="text-red-500">
              <span v-if="v$.client.phoneNumber.primary.required.$invalid">
                Phone Number is required
              </span>
              <span
                v-else-if="!v$.client.phoneNumber.primary.required.$invalid && v$.client.phoneNumber.primary.numeric.$invalid">
                Phone Number must contain only digits
              </span>
              <span
                v-else-if="!v$.client.phoneNumber.primary.required.$invalid && !v$.client.phoneNumber.primary.numeric.$invalid && (v$.client.phoneNumber.primary.minLength.$invalid || v$.client.phoneNumber.primary.maxLength.$invalid)">
                Phone Number must be exactly 10 digits
              </span>
            </span>
          </div>

          <!-- Alternative Phone Number Input Field -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Alternative Phone Number</span>
              <input type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                pattern="[0-9]{3}[0-9]{3}[0-9]{4}" v-model="client.phoneNumber.alternate" />
            </label>
          </div>
        </div>

        <!-- grid container -->
        <div class="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          <h2 class="text-2xl font-bold">Address Details</h2>
          <!-- Address 1 Input Field -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Address Line 1</span>
              <input type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="client.address.line1" />
            </label>
          </div>

          <!-- Address 2 Input Field -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Address Line 2</span>
              <input type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="client.address.line2" />
            </label>
          </div>

          <!-- City Input Field -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">City</span>
              <span style="color: #ff0000">*</span>
              <input type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="client.address.city" />
            </label>
            <!-- Validation error messages -->
            <span v-if="v$.client.address.city.$error" class="text-red-500">
              City is required
            </span>
          </div>
          <div></div>

          <!-- County Input Field -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">County</span>
              <input type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="client.address.county" />
            </label>
          </div>

          <!-- Zip Code Input Field -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Zip Code</span>
              <input type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="client.address.zip" />
            </label>
          </div>
          <div></div>

          <!-- Create mode: Add Client button -->
          <div v-if="!isEdit" class="flex justify-between mt-10 mr-20">
            <button class="bg-red-700 text-white rounded" type="submit">
              Add Client
            </button>
          </div>

          <!-- Edit mode: Update, Delete and Go back buttons (Update/Delete only for editors) -->
          <template v-else>
            <div class="flex justify-between mt-10 mr-20">
              <button class="bg-green-700 disabled:opacity-50 text-white rounded" type="submit"
                :disabled="!canEdit">
                Update Client
              </button>
            </div>
            <div class="flex justify-between mt-10 mr-20">
              <button class="bg-red-700 disabled:opacity-50 text-white rounded" type="button"
                :disabled="!canEdit" @click="submitDelete">
                Delete Client
              </button>
            </div>
            <div class="flex justify-between mt-10 mr-20">
              <button class="border border-red-700 bg-white text-red-700 rounded" type="button"
                @click="router.back()">
                Go back
              </button>
            </div>
          </template>
        </div>
      </form>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import useVuelidate from '@vuelidate/core';
import { required, email, numeric, minLength, maxLength } from '@vuelidate/validators';
import { useLoggedInUserStore } from '../store/loggedInUser';
import { getClients, createClient, getClientById, updateClient, deleteClientbyId } from '../api/api';

const router = useRouter();
const toast = useToast();
const user = useLoggedInUserStore();

// id of the client picked in the dropdown; empty means the form creates a new client
const editingId = ref('');
const clients = ref([]);
const isEdit = computed(() => !!editingId.value);
// only editors may update or delete
const canEdit = computed(() => user.role === 'editor');

const client = reactive({
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phoneNumber: { primary: '', alternate: '' },
  address: { 
    line1: '',
    line2: '', 
    city: '', 
    county: '', 
    zip: '' }
});

const rules = {
  client: {
    firstName: { required },
    lastName: { required },
    email: { required, email },
    phoneNumber: {
      primary: { 
        required,
        numeric,
        minLength: minLength(10),
        maxLength: maxLength(10) }
    },
    address: {
      city: { required } }
  }
};

const v$ = useVuelidate(rules, { client });

// api.js rethrows the server's response body (usually a plain string), so check for that first
function errorMessage(error) {
  const data = error?.response?.data ?? error;
  if (typeof data === 'string' && data.trim()) return data;
  return data?.message || error?.message || 'Unable to save client.';
}

async function loadClient() {
  try {
    const data = await getClientById(editingId.value);
    Object.assign(client, {
      ...data,
      middleName: data.middleName || '',
      phoneNumber: { primary: '', alternate: '', ...(data.phoneNumber || {}) },
      address: { line1: '', line2: '', city: '', county: '', zip: '', ...(data.address || {}) }
    });
    v$.value.$reset();
  } catch (error) {
    toast.error(errorMessage(error));
  }
}

async function submitForm() {
  const isValid = await v$.value.$validate();
  if (!isValid) return;
  try {
    if (isEdit.value) {
      if (!canEdit.value) return;
      const response = await updateClient(editingId.value, client);
      toast.success(typeof response === 'string' ? response : 'Client updated successfully.');
    } else {
      const response = await createClient(client);
      toast.success(typeof response === 'string' ? response : 'Client created successfully.');
    }
    await router.push('/findclient');
  } catch (error) {
    toast.error(errorMessage(error));
  }
}

async function submitDelete() {
  if (!canEdit.value) return;
  if (!window.confirm(`Delete ${client.firstName} ${client.lastName}?`)) return;
  try {
    const response = await deleteClientbyId(editingId.value);
    toast.success(typeof response === 'string' ? response : 'Client deleted successfully.');
    await router.push('/findclient');
  } catch (error) {
    // the server refuses to delete a client who is signed up for events and says why
    toast.error(errorMessage(error));
  }
}

function resetForm() {
  Object.assign(client, {
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: { primary: '', alternate: '' },
    address: { line1: '', line2: '', city: '', county: '', zip: '' }
  });
  v$.value.$reset();
}

async function loadClientList() {
  try {
    clients.value = await getClients();
  } catch (error) {
    toast.error(errorMessage(error));
  }
}

// called when the dropdown changes: fill the form for the picked client, or clear it for "New client"
function onPickClient() {
  if (editingId.value) loadClient();
  else resetForm();
}

onMounted(loadClientList);
</script>