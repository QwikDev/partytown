import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';

// Full Astro Configuration API Documentation:
// https://docs.astro.build/reference/configuration-reference

export default defineConfig({
  integrations: [
    // Enable the Preact renderer to support Preact JSX components.
    preact(),
  ],
  build: {
    site: 'https://partytown.qwik.dev',
  },
});
