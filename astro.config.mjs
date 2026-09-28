import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react()
  ],
  server: {
    port: 4321,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  },
  vite: {
    plugins: [
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  }
});
