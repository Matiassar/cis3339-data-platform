import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // D2: the backend URL is baked into the bundle at build time, so a missing value
  // must stop the build instead of producing an app that silently calls itself.
  const env = loadEnv(mode, process.cwd(), '')
  if (command === 'build' && !env.VITE_ROOT_API) {
    throw new Error(
      'VITE_ROOT_API is not set. Add it to frontend/.env (e.g. VITE_ROOT_API=http://localhost:3000) ' +
        'or set it in your hosting provider before running npm run build.'
    )
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        // was: path.resolve(__dirname, './src') with require('path'), which only works
        // because Vite converts this ES module config; this is the ESM-native way
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    define: {
      // Vue 3.4+ expects these compile-time flags; defining them removes the console warning
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
    },
    preview: {
      port: 4173
    }
  }
})