// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://avinashblog.pages.dev', // Update to your real domain
  output: 'static',
  adapter: cloudflare(),
  integrations: [sitemap()],
  vite: {
    ssr: {
      // These modules contain Node.js-only code that runs only at build time.
      // Marking them external tells Vite/Rollup NOT to bundle them —
      // they'll be resolved from the Node.js runtime during the build step.
      external: [
        'node:fs', 'node:path', 'node:os', 'node:crypto',
        'fs', 'path', 'os', 'crypto',
        'gray-matter',   // kept in package.json but not used anymore (safe to list)
      ],
    },
    optimizeDeps: {
      // Exclude Node-only packages from Vite's dep optimizer
      exclude: ['gray-matter'],
    },
  },
});