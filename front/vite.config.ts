import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // SPA fallback handled by BrowserRouter — no extra config needed in dev
  // For production deploy: configure server to serve index.html for all routes
})
