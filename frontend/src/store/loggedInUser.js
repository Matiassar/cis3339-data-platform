// This Pinia store manages the logged-in user's session
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import { loginUser, logoutUser, setAuthHeader } from '../api/api'
import jwt_decode from 'jwt-decode'

const toast = useToast()

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

    // Restore the saved session when the application starts
    restoreSession() {
      const token = localStorage.getItem("authToken");

      // No saved token means the user is logged out
      if (!token) {
        this.$reset();
        return;
      }

      try {
        // Decode the saved JWT
        const decodedToken = jwt_decode(token);

        // Check whether the token has expired
        const currentTime = Math.floor(Date.now() / 1000);

        if (
          typeof decodedToken.exp !== "number" ||
          decodedToken.exp <= currentTime
        ) {
          throw new Error("Token is expired or has no valid expiration");
        }

        // Validate the user's role
        if (
          !["editor", "viewer"].includes(decodedToken.role)
        ) {
          throw new Error("Token contains an invalid role");
        }

        // Restore the user's information
        // Username is optional because the backend JWT only contains role and timestamps
        this.$patch({
          name: typeof decodedToken.name === "string"
            ? decodedToken.name
            : "",
          role: decodedToken.role,
          isLoggedIn: true
        });

        // Restore the Authorization header
        setAuthHeader(token);

      } catch (error) {
        console.warn("Invalid session:", error.message);

        // Remove invalid or expired token and clear API authorization
        logoutUser();

        // Reset login state
        this.$reset();
      }
    },

    // Log in using username and password
    async login(username, password) {
      try {
        const token = await loginUser(username, password);

        const decodedToken = jwt_decode(token);

        this.$patch({
          isLoggedIn: true,
          role: decodedToken.role,
          name: decodedToken.name || ""
        });

        this.$router.push("/");

        toast.success("Login Successful!");

      } catch (error) {
        toast.error(error.message);
      }
    },

    // Log out
    logout() {
      // Remove saved token and authorization header
      logoutUser();

      // Reset login state
      this.$reset();

      // Navigate to dashboard
      this.$router.push("/");

      toast.info("You have been logged out!");
    }
  }
});