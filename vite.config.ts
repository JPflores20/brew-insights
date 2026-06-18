/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Configuración de Vite (Empaquetador web)
 * -----------------------------------------
 * Define cómo se compila y sirve el proyecto React.
 * Incluye la configuración del servidor de desarrollo, resolución de alias ('@/'),
 * configuración de pruebas (Vitest) y separación del código (code splitting) 
 * para optimizar el rendimiento en producción.
 */
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      // CORRECCIÓN IMPORTANTE: Usamos process.cwd() en lugar de __dirname
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
}));