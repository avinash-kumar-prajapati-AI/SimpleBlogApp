---
id: deploying-astro-cloudflare-pages
title: "Deploying Astro Sites to Cloudflare Pages — The Complete Guide"
description: "Everything you need to know to deploy an Astro static site to Cloudflare Pages — from project setup to CI/CD pipelines and environment variables."
tags: [astro, cloudflare, deployment, cicd, static-site, javascript]
category: cloudflare
modified_date: 2026-06-25
thumbnail:
draft: false
external_links:
  - label: "Cloudflare Pages Docs"
    url: "https://developers.cloudflare.com/pages/"
  - label: "Astro Cloudflare Adapter"
    url: "https://docs.astro.build/en/guides/integrations-guide/cloudflare/"
---

# Deploying Astro Sites to Cloudflare Pages — The Complete Guide

Cloudflare Pages + Astro is one of the best combinations for static site hosting: unlimited bandwidth on the free tier, global CDN with 300+ edge locations, and build times under 30 seconds.

## Why Cloudflare Pages?

- **Free tier is genuinely free** — unlimited sites, unlimited bandwidth, 500 builds/month
- **Edge-first** — your static HTML serves from the nearest of 300+ PoPs worldwide
- **Zero cold starts** — unlike Lambda/Vercel serverless, static assets are pure CDN
- **Deploy hooks** — trigger rebuilds from any CI system without exposing credentials

## Step 1: Astro Setup

```bash
npm create astro@latest my-blog -- --template minimal
cd my-blog
npx astro add cloudflare sitemap
```

In `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://your-site.pages.dev',
  output: 'static',
  adapter: cloudflare(),
  integrations: [sitemap()],
});
```

## Step 2: Connect to Cloudflare Pages

1. Push your Astro repo to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → Create a project
3. Connect GitHub and select your repo
4. Build settings:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

## Step 3: Environment Variables

Go to your Pages project → Settings → Environment Variables. Add:

| Variable | Environment |
|---|---|
| `GITHUB_TOKEN` | Production + Preview |
| `PUBLIC_SITE_URL` | Production only |

Variables starting with `PUBLIC_` are exposed to client-side code. Keep secrets unprefixed.

## Step 4: Deploy Hook (for content-triggered rebuilds)

In Pages → Settings → Builds & Deployments → Deploy Hooks:

1. Create a hook named "Content Update"
2. Copy the hook URL
3. Add it as `CLOUDFLARE_DEPLOY_HOOK` secret in your content repo's GitHub settings
4. Trigger it from a GitHub Action on content changes:

```yaml
- name: Trigger rebuild
  run: curl -X POST "${{ secrets.CLOUDFLARE_DEPLOY_HOOK }}"
```

## Step 5: Custom Domain

In Pages → Custom Domains:
1. Add your domain (e.g., `blog.yourdomain.com`)
2. Add the CNAME record Cloudflare shows you to your DNS provider
3. HTTPS is automatic — Cloudflare provisions a certificate within minutes

## Debugging Build Failures

Common issues:
- **`fs` not available** — you're using Node.js built-ins in code that runs in the Workers runtime. Either use the `nodejs_compat` flag in `wrangler.jsonc` or avoid Node.js APIs.
- **Missing env vars** — build-time env vars must be added in Pages settings, not just locally
- **Large bundle** — Cloudflare Pages has a 25MB asset size limit per file; compress images

## Build Performance Tips

- Add `node_modules` to `.cloudflare/cache` paths in `wrangler.jsonc`
- Use `pnpm` instead of `npm` — faster installs in CI
- Minimize the number of GitHub API calls at build time — batch requests

## Conclusion

Cloudflare Pages is one of the few platforms where "free" genuinely means no hidden limits on bandwidth or requests. For a static blog, it's the best hosting choice available today.
