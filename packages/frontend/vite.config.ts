import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm"; // Import the plugin
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    wasm(), // Add the wasm plugin here
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // This section is important for the dev server to work correctly with Wasm dependencies
  optimizeDeps: {
    exclude: ['argon2-browser']
  },
});