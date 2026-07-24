import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const normalizePath = (id) => id.replaceAll("\\", "/");

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = normalizePath(id);

          if (!normalizedId.includes("node_modules")) {
            return undefined;
          }

          if (normalizedId.includes("node_modules/framer-motion/")) {
            return "motion";
          }

          if (
            normalizedId.includes("node_modules/react/") ||
            normalizedId.includes("node_modules/react-dom/") ||
            normalizedId.includes("node_modules/react-router-dom/")
          ) {
            return "react";
          }

          return undefined;
        },
      },
    },
  },
})
