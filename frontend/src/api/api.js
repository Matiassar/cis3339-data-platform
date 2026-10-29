// This file contains all API calls to the backend.
//
// F2: every error now goes through ONE response interceptor (below), which turns it into
// a plain Error with a short, readable message. That replaced the try/catch wrapper that
// used to be repeated in every function (some rethrew `error`, others `error.response.data`,
// which crashed with a TypeError when the backend was down).
import axios from "axios";

// Create HTTP client with the base URL from frontend/.env, sending JSON
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_ROOT_API,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth header helpers
// After login, every request carries "Authorization: Bearer <token>"
export function setAuthHeader(token) {
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// When the user logs out, stop sending the token
function removeAuthHeader() {
  delete apiClient.defaults.headers.common["Authorization"];
}

// Error handling (F2)
// Pull a readable message out of whatever the backend sent back
function messageFromResponse(response) {
  const body = response.data;
  if (typeof body === "string" && body.trim()) return body;
  if (body?.errors?.[0]?.msg) return body.errors[0].msg; // express-validator style
  if (body?.message) return body.message;
  if (body?.error) return body.error;
  return `Request failed (${response.status})`;
}

// On a 401 (missing/expired token), clear the whole session and send the user to /login.
// The store and router are imported lazily to avoid a circular import
// (the store imports this file, and the router imports the store).
async function handleUnauthorized() {
  localStorage.removeItem("authToken");
  removeAuthHeader();

  const [{ useLoggedInUserStore }, { default: router }] = await Promise.all([
    import("../store/loggedInUser"),
    import("../router"),
  ]);
  useLoggedInUserStore().$reset();

  const current = router.currentRoute.value;
  if (current.path !== "/login") {
    router.push({ path: "/login", query: { redirect: current.fullPath } });
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // No response at all: backend down, wrong URL, or network/CORS failure
    if (!error.response) {
      const networkError = new Error("Unable to reach the server");
      networkError.status = null;
      return Promise.reject(networkError);
    }

    const { status, config } = error.response;

    // A failed login is a 400 from /users/login, so it never triggers the logout redirect
    if (status === 401 && !config.url.includes("/users/login")) {
      await handleUnauthorized();
    }

    const apiError = new Error(messageFromResponse(error.response));
    apiError.status = status; // kept so callers can check e.g. 403 or 404 if needed
    return Promise.reject(apiError);
  }
);

// Login related API calls
// Log in, save the token, and attach it to future requests
export async function loginUser(username, password) {
  const response = await apiClient.post("/users/login", { username, password });
  const token = response.data.token;
  localStorage.setItem("authToken", token);
  setAuthHeader(token);
  return token;
}

// Log out: remove the saved token and stop sending it
export function logoutUser() {
  localStorage.removeItem("authToken");
  removeAuthHeader();
}

// Org related API calls
// Get the organization name shown in the sidebar
export async function getOrgName() {
  const response = await apiClient.get("/org");
  return response.data;
}

// Events related API calls
// GET all events for the org
export const getEvents = async () => {
  const response = await apiClient.get("/events/");
  return response.data;
};

// GET a single event by ID
export const getEventById = async (id) => {
  const response = await apiClient.get(`/events/id/${id}`);
  return response.data;
};

// GET events matching a search (by name or by date)
export const searchEvents = async (query) => {
  const params = {};
  if (query.searchBy === "name") {
    params.searchBy = query.searchBy;
    params.name = query.name || "";
  } else if (query.searchBy === "date") {
    params.searchBy = "date";
    params.eventDate = query.eventDate || "";
  }
  const response = await apiClient.get("/events/search", { params });
  return response.data;
};

// GET events a client is signed up for
export const getClientEvents = async (id) => {
  const response = await apiClient.get(`/events/client/${id}`);
  return response.data;
};

// GET events a client is NOT signed up for
export const getNonClientEvents = async (id) => {
  const response = await apiClient.get(`/events/client/${id}/not-registered`);
  return response.data;
};

// GET all attendees for an event
export const getEventAttendees = async (id) => {
  const response = await apiClient.get(`/events/attendees/${id}`);
  return response.data;
};

// GET all events that use a given service
export const getEventsByServiceId = async (id) => {
  const response = await apiClient.get(`/events/service/${id}`);
  return response.data;
};

// POST a new event
export const createEvent = async (eventData) => {
  const response = await apiClient.post("/events/", eventData);
  return response.data;
};

// PUT updates to an event
export const updateEvent = async (id, eventData) => {
  const response = await apiClient.put(`/events/update/${id}`, eventData);
  return response.data;
};

// Registration responses (B1 API contract)
// The register/deregister endpoints may answer with:
//   - plain text (current backend), e.g. "Client added to event"
//   - { message: "Already registered" } or { message: "Not registered" } (B1 rules)
//   - the created/removed record on the first successful call (also allowed by B1)
// These functions always return a short readable string, so pages can show it directly
// and won't need changes when the backend switches to the B1 shapes in Sprint 3.
function registrationMessage(data, fallback) {
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  return fallback;
}

// PUT: register a client for an event; resolves to a readable message
export const registerAttendee = async (eventId, clientId) => {
  const response = await apiClient.put(
    "/events/register",
    {},
    { params: { event: eventId, client: clientId } }
  );
  return registrationMessage(response.data, "Client registered for event");
};

// PUT: remove a client from an event; resolves to a readable message
export const deregisterAttendee = async (eventId, clientId) => {
  const response = await apiClient.put(
    "/events/deregister",
    {},
    { params: { event: eventId, client: clientId } }
  );
  return registrationMessage(response.data, "Client removed from event");
};

// DELETE an event by ID
export const deleteEvent = async (id) => {
  const response = await apiClient.delete(`/events/${id}`);
  return response.data;
};

// GET events from the last two months for the dashboard
export const getAttendance = async () => {
  const response = await apiClient.get("/events/attendance");
  return response.data;
};

// Clients related API calls
// GET all clients for the org
export const getClients = async () => {
  const response = await apiClient.get("/clients");
  return response.data;
};

// GET a single client by ID
export const getClientById = async (id) => {
  const response = await apiClient.get(`/clients/id/${id}`);
  return response.data;
};

// GET clients matching a search (by name or by phone number)
export const searchClients = async (query) => {
  const params = {};
  if (query.searchBy === "name") {
    params.searchBy = query.searchBy;
    params.firstName = query.firstName || "";
    params.lastName = query.lastName || "";
  } else if (query.searchBy === "number") {
    params.searchBy = query.searchBy;
    params.phoneNumber = query.phoneNumber || "";
  }
  const response = await apiClient.get("/clients/search", { params });
  return response.data;
};

// POST a new client
export const createClient = async (newClient) => {
  const response = await apiClient.post("/clients", newClient);
  return response.data;
};

// PUT updates to a client
export const updateClient = async (id, updatedClient) => {
  const response = await apiClient.put(`/clients/update/${id}`, updatedClient);
  return response.data;
};

// DELETE a client by ID
export const deleteClientbyId = async (id) => {
  const response = await apiClient.delete(`/clients/${id}`);
  return response.data;
};

// GET client counts by ZIP code for the dashboard
export const getClientsByZipCode = async () => {
  const response = await apiClient.get("/clients/byzip");
  return response.data;
};

// Services related API calls
// GET all services for the org
export const getServices = async () => {
  const response = await apiClient.get("/services/");
  return response.data;
};

// GET a single service by ID
export const getServiceById = async (id) => {
  const response = await apiClient.get(`/services/id/${id}`);
  return response.data;
};

// GET services matching a search (by name or by description)
export const searchServices = async (query) => {
  const params = { searchBy: query.searchBy };
  if (query.searchBy === "name") {
    params.name = query.name || "";
  } else if (query.searchBy === "description") {
    params.description = query.description;
  }
  const response = await apiClient.get("/services/search", { params });
  return response.data;
};

// POST a new service
export const createService = async (newService) => {
  const response = await apiClient.post("/services", newService);
  return response.data;
};

// PUT updates to a service
export const updateService = async (id, updatedService) => {
  const response = await apiClient.put(`/services/update/${id}`, updatedService);
  return response.data;
};

// DELETE a service by ID
export const deleteService = async (id) => {
  const response = await apiClient.delete(`/services/${id}`);
  return response.data;
};