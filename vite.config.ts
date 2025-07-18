import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: false, // Disable TypeScript checking
    }),
  ],
  server: {
    allowedHosts: [
      'dajubhai.zokchen.com.np',
      'dajuvai.com',
    ],
  },
});