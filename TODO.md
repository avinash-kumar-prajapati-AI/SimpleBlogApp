# Blog Project TODO
> Work top-to-bottom. Each phase must be complete before starting the next.

---

## Phase 1 — Repository Setup

- [ ] Create private GitHub repo `blog_repo`
- [ ] Create folder structure: `articles/`, `media/images/`, `media/docs/`
- [ ] Create `articles/visibility.txt` with category visibility + 5 sidebar picks format
- [ ] Create `articles/drafts.txt`
- [ ] Create at least 1 sample category folder with `aboutcategory.txt`
- [ ] Write 3 sample articles with full frontmatter (id, title, description, tags, etc.)
- [ ] Create `media/docs/active-role.txt`
- [ ] Create first `media/docs/[job-role]/profile.json` with all resume sections
- [ ] Add resume PDF to `media/docs/[job-role]/resume.pdf`

---

## Phase 2 — Astro Project Init

- [ ] `npm create astro@latest` — choose empty template
- [ ] `npx astro add cloudflare` — install adapter
- [ ] `npx astro add sitemap` — for SEO sitemap
- [ ] Set `output: 'static'` in `astro.config.mjs`
- [ ] Install `@astrojs/rss`, `gray-matter`, `marked` or `unified` for markdown parsing
- [ ] Install IBM Plex font (Google Fonts or self-hosted)
- [ ] Create `.env` with `GITHUB_TOKEN`
- [ ] Create `wrangler.toml`

---

## Phase 3 — Core Lib Layer

- [ ] `src/lib/github.ts` — fetch file list and file content from private repo
- [ ] `src/lib/parseArticles.ts` — parse frontmatter + markdown content
- [ ] `src/lib/resumeLoader.ts` — fetch and parse `profile.json`
- [ ] `src/lib/searchIndex.ts` — build static JSON index of all articles at build time
- [ ] Test all lib functions locally with `astro dev`

---

## Phase 4 — Layouts & Global Components

- [ ] `BaseLayout.astro` — head meta, AdSense `is:inline` script placeholder, fonts
- [ ] `AdUnit.astro` — reusable ad slot with hardcoded `min-height` (CLS safe)
- [ ] `TagPill.astro` — clickable, routes to `/search?q=@tag [name]`
- [ ] `ShareBar.astro` — Twitter, LinkedIn, WhatsApp, copy link
- [ ] `Sidebar.astro` — right sidebar, toggle button, click-outside-to-close logic
- [ ] `ArticleCard.astro` — thumbnail, title, description, category, date
- [ ] `SearchBar.astro` — input supporting `@tag` and `@category` prefix syntax

---

## Phase 5 — Pages

- [ ] `index.astro` — homepage: hero, recent articles grid, ad slots
- [ ] `articles/[category].astro` — category listing: aboutcategory text, article cards, ad slot
- [ ] `articles/[category]/[slug].astro` — article detail: content, ShareBar, TagPills, ad slots
- [ ] `search.astro` — search input + client-side filter over search index JSON
- [ ] `categories.astro` — all categories section + all tags section, both clickable
- [ ] `about.astro` — resume rendered from profile.json (no ads on this page)
- [ ] `privacy.astro` — AdSense disclosure, cookie policy
- [ ] `contact.astro` — contact info or simple form
- [ ] `404.astro` — custom error page with asset from media/assets

---

## Phase 6 — Theme & UI Polish

- [ ] Apply IBM color tokens globally via CSS variables
- [ ] IBM Plex Sans for all body text
- [ ] IBM Plex Mono for all code blocks
- [ ] Sidebar toggle + click-outside behavior working on mobile
- [ ] Footer strip: copyright, social icons, Categories link
- [ ] Responsive layout — mobile, tablet, desktop
- [ ] All ad unit placeholders visible (grey box) before AdSense approval

---

## Phase 7 — SEO & Compliance

- [ ] Unique `<title>` and `<meta description>` on every page
- [ ] Open Graph tags on every article page
- [ ] Twitter card meta on every article page
- [ ] `sitemap.xml` auto-generated and linked in `<head>`
- [ ] `robots.txt` in `public/`
- [ ] Article structured data (JSON-LD schema) on article pages
- [ ] Privacy page complete with AdSense + cookie disclosure language
- [ ] About page complete with real author identity
- [ ] Contact page live

---

## Phase 8 — Cloudflare Deployment

- [ ] Create Cloudflare Pages project, connect to Astro repo (not blog_repo)
- [ ] Add `GITHUB_TOKEN` to Cloudflare Pages environment variables (Production + Preview)
- [ ] Get Cloudflare Deploy Hook URL from Pages → Settings → Builds & Deployments
- [ ] Add `CLOUDFLARE_DEPLOY_HOOK` as GitHub secret in blog_repo
- [ ] Create `.github/workflows/deploy.yml` in blog_repo (trigger on `articles/**` and `media/**` changes)
- [ ] Test full flow: push article → action fires → Cloudflare rebuilds → live

---

## Phase 9 — AdSense Application

- [ ] Minimum 15-20 quality articles published
- [ ] All compliance pages live (About, Contact, Privacy)
- [ ] Site on custom domain (required for AdSense)
- [ ] Site has been live for at least 2-4 weeks with some traffic
- [ ] Apply at google.com/adsense
- [ ] After approval: replace ad placeholder boxes with real AdSense unit codes
- [ ] Verify no CLS issues after real ads load (use PageSpeed Insights)

---

## Phase 10 — Post Launch

- [ ] Add second job role resume to `media/docs/`
- [ ] Monitor Cloudflare Pages build minutes (stay under 500/month free limit)
- [ ] Check GitHub repo size periodically (stay under 800MB to be safe)
- [ ] Add Open Graph image per article (improves social share CTR)
- [ ] Submit sitemap to Google Search Console
