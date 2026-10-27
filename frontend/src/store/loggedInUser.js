// This Pinia store manages the logged-in user's state
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import { loginUser, logoutUser, setAuthHeader } from '../api/api'
import jwt_decode from 'jwt-decode'

// Notifications
const toast = useToast()

// Defining the store
export const useLoggedInUserStore = defineStore({
  id: 'loggedInUser',

  state: () => {
    return {
      name: "",
      role: "",
      isLoggedIn: false
    }
  },

  actions: {

    // CHECKPOINT 1: Restore login when the page refreshes
    restoreSession() {
      const token = localStorage.getItem("authToken");

      // If there is no saved token, remain logged out
      if (!token) {
        return;
      }

      try {
        // Decode the saved JWT
        const decodedToken = jwt_decode(token);

        // Restore the user's name, role, and login status
        this.$patch({
          name: decodedToken.name,
          role: decodedToken.role,
          isLoggedIn: true
        });

        // Restore the authorization header for API requests
        setAuthHeader(token);

      } catch (error) {
        console.error("Failed to restore session:", error);
      }
    },

    // Log in using username and password
    async login(username, password) {
      try {
        const token = await loginUser(username, password);

        // Get the user's name and role from the JWT
        const decodedToken = jwt_decode(token);

        this.$patch({
          isLoggedIn: true,
          role: decodedToken.role,
          name: decodedToken.name
        });

        this.$router.push("/");

        toast.success("Login Successful!");

      } catch (error) {
        toast.error(error.message);
      }
    },

    // Log out
    logout() {
      logoutUser();

      // Reset the user's state
      this.$patch({
        name: "",
        role: "",
        isLoggedIn: false
      });

      this.$router.push("/");

      toast.info("You have been logged out!");
    }
  }
});