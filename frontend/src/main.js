import { createApp, markRaw } from "vue";
import router from "./router";
import App from "./App.vue";
import "./index.css";

import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

import { createPinia } from "pinia";
import { useLoggedInUserStore } from "./store/loggedInUser";

const app = createApp(App);

// Create the Pinia store
const pinia = createPinia();

// Allow Pinia stores to access Vue Router
pinia.use(({ store }) => {
  store.$router = markRaw(router);
});

// Register Pinia
app.use(pinia);

// CHECKPOINT 1: Restore saved login when the app starts
const loggedInUserStore = useLoggedInUserStore();
loggedInUserStore.restoreSession();

// Register Vue Router
app.use(router);

// Configure notifications
const options = {
  position: "bottom-right"
};

app.use(Toast, options);

// Mount the application
app.mount("#app");