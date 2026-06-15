import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add the preview configuration for production builds
  preview: {
    port: 4175,
    host: "0.0.0.0",
    allowedHosts: [
      "admin.radiantraysindia.com",
      "www.admin.radiantraysindia.com",
    ],
  },
  // Add server configuration for development
  server: {
    host: "0.0.0.0",
    allowedHosts: [
      "admin.radiantraysindia.com",
      "www.admin.radiantraysindia.com",
    ],
  },
  // SPA fallback handled by BrowserRouter — no extra config needed in dev
  // For production deploy: configure server to serve index.html for all routes
})
