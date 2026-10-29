// Vitest configuration for the frontend unit tests (bonus: automated tests).
// Kept separate from vite.config.js so test settings never affect the production build.
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    // Test files share one fake-server port, so run them one at a time
    threads: false,
    include: ['tests/**/*.test.js'],
    // Tests talk to a small fake server started inside the test file,
    // never to the team's real backend or database.
    env: {
      VITE_ROOT_API: 'http://127.0.0.1:4555'
    }
  }
})