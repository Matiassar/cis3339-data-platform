import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import { loginUser, logoutUser, setAuthHeader } from '../api/api'
import jwt_decode from 'jwt-decode'

const toast = useToast()

export const useLoggedInUserStore = defineStore({
  id: 'loggedInUser',

  state: () => {
    return {
      name: '',
      role: '',
      isLoggedIn: false
    }
  },

  actions: {

    // Restore login when the application starts
    restoreSession() {
      const token = localStorage.getItem('authToken')

      if (!token) {
        this.$reset()
        return
      }

      try {
        const decodedToken = jwt_decode(token)
        const currentTime = Math.floor(Date.now() / 1000)

        // Check expiration
        if (
          typeof decodedToken.exp !== 'number' ||
          decodedToken.exp <= currentTime
        ) {
          throw new Error('Token is expired or has no valid expiration')
        }

        // Validate role
        if (!['editor', 'viewer'].includes(decodedToken.role)) {
          throw new Error('Token contains an invalid role')
        }

        // Restore user information
        this.$patch({
          name: typeof decodedToken.name === 'string'
            ? decodedToken.name
            : '',
          role: decodedToken.role,
          isLoggedIn: true
        })

        // Restore authorization header
        setAuthHeader(token)

      } catch (error) {
        console.warn('Invalid session:', error.message)

        logoutUser()
        this.$reset()
      }
    },

    // Login and navigate to the originally requested page
    async login(username, password, redirect = '/') {
      try {
        const token = await loginUser(username, password)
        const decodedToken = jwt_decode(token)

        this.$patch({
          isLoggedIn: true,
          role: decodedToken.role,
          name: decodedToken.name || ''
        })

        toast.success('Login Successful!')

        // Only allow internal application paths
        const destination =
          typeof redirect === 'string' &&
          redirect.startsWith('/') &&
          !redirect.startsWith('//') &&
          !redirect.startsWith('/\\')
            ? redirect
            : '/'

        // Router guard will enforce editor permissions
        await this.$router.push(destination)

        return true

      } catch (error) {
        toast.error(error.message)
        return false
      }
    },

    // Logout and reset user state
    logout() {
      logoutUser()

      this.$reset()

      this.$router.push('/')

      toast.info('You have been logged out!')
    }
  }
})