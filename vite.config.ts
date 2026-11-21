import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\/](react|react-dom|scheduler|react-router|react-router-dom)[\/]/ },
            { name: 'motion', test: /node_modules[\/](framer-motion|motion-dom|motion-utils)[\/]/ },
            { name: 'supabase', test: /node_modules[\/]@supabase[\/]/ },
            { name: 'ui', test: /node_modules[\/](@radix-ui|lucide-react|sonner)[\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
