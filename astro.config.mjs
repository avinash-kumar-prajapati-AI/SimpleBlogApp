import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Manually load .env into process.env for Node.js context at build/dev start
try {
  const envPath = join(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.warn('Failed to load local .env:', e);
}

const envPath = join(process.cwd(), '.env');
console.log(`[Config] envPath: ${envPath}, exists: ${existsSync(envPath)}`);
console.log(`[Config] Loaded process.env.GITHUB_TOKEN length: ${process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.length : 0}`);

export default defineConfig({
  site: 'https://simpleblogapp.pages.dev',
  output: 'static',
  adapter: cloudflare(),
  integrations: [sitemap()],
  vite: {
    define: {
      'import.meta.env.GITHUB_TOKEN': JSON.stringify(process.env.GITHUB_TOKEN),
      'import.meta.env.GITHUB_REPO_OWNER': JSON.stringify(process.env.GITHUB_REPO_OWNER),
      'import.meta.env.GITHUB_REPO_NAME': JSON.stringify(process.env.GITHUB_REPO_NAME),
      'import.meta.env.GITHUB_BRANCH': JSON.stringify(process.env.GITHUB_BRANCH),
      'process.env.GITHUB_TOKEN': JSON.stringify(process.env.GITHUB_TOKEN),
      'process.env.GITHUB_REPO_OWNER': JSON.stringify(process.env.GITHUB_REPO_OWNER),
      'process.env.GITHUB_REPO_NAME': JSON.stringify(process.env.GITHUB_REPO_NAME),
      'process.env.GITHUB_BRANCH': JSON.stringify(process.env.GITHUB_BRANCH),
    },
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