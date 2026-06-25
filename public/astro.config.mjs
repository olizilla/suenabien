import { defineConfig } from 'astro/config';
import og from 'astro-og';
// https://astro.build/config
export default defineConfig({
  integrations: [og()]
});