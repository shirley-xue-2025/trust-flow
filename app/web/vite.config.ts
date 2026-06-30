import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = process.env.VITE_BACKEND ?? 'http://localhost:8080';
// `npm run dev:network` sets VITE_NETWORK=1 → bind 0.0.0.0 and accept proxied /
// tunnel Host headers, so the dev server is reachable from another device or a
// public tunnel (e.g. cloudflared). Off by default; normal dev stays localhost.
const NETWORK = !!process.env.VITE_NETWORK;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: NETWORK ? true : undefined, // bind all interfaces for LAN/tunnel access
    allowedHosts: NETWORK ? true : undefined, // accept tunnel domains (dev only)
    proxy: {
      // Proxy API + SSE to the backend; SSE must NOT be buffered.
      '/v1': { target: BACKEND, changeOrigin: true },
    },
  },
});
