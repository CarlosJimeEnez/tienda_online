// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  vite: {
    server: {
      allowedHosts: [
        'localhost', // Permite el acceso desde localhost
        '.localhost', // También puede ser necesario
        '13ea-187-188-251-239.ngrok-free.app' // Permite el acceso desde tu URL de ngrok
      ]
    },
    plugins: [tailwindcss()]
  },

  integrations: [vue()]
});