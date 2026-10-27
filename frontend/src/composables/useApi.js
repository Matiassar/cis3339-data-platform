// useApi: shared loading / data / error state for any API call (F2).
//
// Usage:
//   const { data, loading, error, execute } = useApi(() => getClients())
//   onMounted(execute)                     // load when the page opens
//   <button @click="execute">Retry</button>
//
// Calls that need arguments (like a search) can pass them through execute():
//   const { data, execute } = useApi((query) => searchClients(query))
//   execute({ searchBy: 'name', firstName: 'Ana' })
//
// Error messages come from the Axios interceptor in api/api.js, so `error` is
// always a short human-readable string, never an object.
import { ref } from 'vue'

export function useApi(apiCall) {
  const data = ref(null) // result of the last successful call; null until then
  const loading = ref(false) // true while a request is in flight
  const error = ref(null) // short message on failure; null when nothing is wrong

  // Counts calls so that if execute() runs twice quickly (e.g. two searches),
  // a slow first response can't overwrite the newer one.
  let latestCall = 0

  async function execute(...args) {
    const callId = ++latestCall
    loading.value = true
    error.value = null

    try {
      const result = await apiCall(...args)
      if (callId === latestCall) data.value = result
      return result
    } catch (err) {
      if (callId === latestCall) {
        data.value = null // never leave stale rows on screen next to an error
        error.value = err?.message || 'Something went wrong'
      }
      return null
    } finally {
      if (callId === latestCall) loading.value = false
    }
  }

  return { data, loading, error, execute }
}

export default useApi