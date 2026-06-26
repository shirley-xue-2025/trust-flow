import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = process.env.VITE_BACKEND ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API + SSE to the backend; SSE must NOT be buffered.
      '/v1': { target: BACKEND, changeOrigin: true },
    },
  },
});
