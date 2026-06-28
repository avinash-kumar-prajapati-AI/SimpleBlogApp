# Blog Implementation Plan
> Stack: Astro · Cloudflare Pages · Private GitHub Repo · IBM-inspired theme

---

## 1. Repository Structure (blog_repo)

```
blog_repo/
├── articles/
│   ├── visibility.txt              # which categories are visible + 5 sidebar picks
│   ├── drafts.txt                  # list of draft article slugs (rest = public)
│   └── [category-name]/
│       ├── aboutcategory.txt
│       └── [article-slug].md       # id, title, SEO meta, modified_date, external links, content
├── media/
│   ├── images/
│   │   ├── articles/
│   │   │   └── [article-slug]/     # thumbnail + content images
│   │   ├── assets/                 # hero, 404, offline, server-error graphics
│   │   └── icons/                  # site favicon, UI icons
│   └── docs/
│       ├── active-role.txt         # which job_role to show on About page
│       └── [job-role]/
│           ├── resume.pdf
│           └── profile.json        # full resume data (see §2)
```

---

## 2. Article Markdown Frontmatter Schema

```
---
id:
title:
description:         # SEO meta description
tags:                # array, trending + niche tags
category:
modified_date:
external_links:
  - label: "Visit Product"
    url:
thumbnail:           # path in media/images/articles/[slug]/
draft: false
---
```

---

## 3. profile.json Schema (About / Resume)

Sections: `personal`, `social`, `experience`, `projects`, `education`, `skills`, `certificates`, `achievements`

Key rules:
- `projects[]` → include blog article URL as project link
- `certificates[]` → minimum 2 credential source links each
- `education[]` → institution page link required
- `skills[]` → GitHub repo link where skill was used (manual entry)

---

## 4. Astro Project Structure

```
astro-blog/
├── public/                         # static assets copied from blog_repo/media
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro        # AdSense is:inline script, CLS placeholders
│   ├── components/
│   │   ├── Sidebar.astro           # right sidebar, toggleable, click-outside closes
│   │   ├── SearchBar.astro         # @tag / @category filtering
│   │   ├── ArticleCard.astro
│   │   ├── AdUnit.astro            # reusable ad placeholder (min-height hardcoded)
│   │   ├── ShareBar.astro          # bottom of article
│   │   └── TagPill.astro           # clickable → /search?@category or @tag
│   ├── pages/
│   │   ├── index.astro             # homepage
│   │   ├── search.astro            # search + filter page
│   │   ├── categories.astro        # all categories + all tags
│   │   ├── about.astro             # resume from profile.json
│   │   ├── privacy.astro           # AdSense + cookie disclosure (required)
│   │   ├── contact.astro           # E-E-A-T compliance
│   │   ├── 404.astro
│   │   └── articles/
│   │       ├── [category].astro    # category listing page
│   │       └── [category]/
│   │           └── [slug].astro    # article detail page
│   └── lib/
│       ├── github.ts               # fetch from private repo (build-time)
│       ├── parseArticles.ts        # markdown + frontmatter parser
│       └── resumeLoader.ts         # loads profile.json
├── .env                            # GITHUB_TOKEN (local)
├── astro.config.mjs               # output: static, adapter: cloudflare
└── wrangler.toml
```

---

## 5. Pages & Ad Placement Plan

| Page | Layout | Ad Slots | Notes |
|---|---|---|---|
| Homepage | 3-col | After hero, between article rows | Fixed min-height wrappers |
| Category listing | 2-col | Top banner, mid-feed | |
| Article detail | 2-col + sidebar | After intro, mid-content, end of article, sidebar sticky | Highest revenue page |
| Search results | 2-col | Top banner | |
| Categories page | Full | Top banner | |
| About | Full | None | E-E-A-T page — no ads |
| Privacy / Contact | Full | None | Compliance pages |

All ad slots use `<AdUnit />` component with hardcoded `min-height` to prevent CLS.

---

## 6. Sidebar Behavior

- Default: visible on desktop, hidden on mobile
- Toggle button always visible
- Clicking outside sidebar on mobile → closes it
- Contains: top 5 categories (from `visibility.txt`), recent articles, tag cloud
- Category clicks → `/search?q=@category [name]`

---

## 7. Search & Filter Logic

Build-time: all article metadata indexed into a JSON file at build.
Client-side: lightweight filter over that JSON (no server needed).

Filter syntax:
- `@tag javascript` → filter by tag
- `@category engineering` → filter by category
- Plain text → title + description search

---

## 8. Footer

Single strip bar containing:
- Copyright text
- Social media icon links (from profile.json)
- "Categories" link → `/categories`

`/categories` page:
- Section 1: all category pills (clickable → `/search?q=@category [name]`)
- Section 2: all tag pills (clickable → `/search?q=@tag [name]`)

---

## 9. GitHub → Cloudflare Build Flow

```
Push .md to blog_repo/articles/
        ↓
GitHub Action detects change in articles/ or media/
        ↓
POST to Cloudflare Pages Deploy Hook
        ↓
Cloudflare builds Astro (fetches GitHub content via GITHUB_TOKEN)
        ↓
Static HTML deployed to CDN edge
        ↓
Live in ~30 seconds
```

All GitHub fetching happens at build time only. Browser never contacts GitHub.

---

## 10. SEO & AdSense Compliance Checklist

- `output: 'static'` → pure HTML for every article (100% crawler-readable)
- AdSense script via `is:inline` in BaseLayout
- All ad units wrapped in fixed min-height containers (CLS prevention)
- Multi-page routing only (no SPA transitions) → no ad refresh violations
- Privacy Policy page with AdSense + cookie disclosure
- About page with author identity (E-E-A-T)
- Contact page
- Each article has unique `description` + `tags` frontmatter
- `modified_date` in frontmatter → used in sitemap + article schema
- Auto-generated `sitemap.xml` via `@astrojs/sitemap`
- `robots.txt` configured
- Open Graph + Twitter card meta per article

---

## 11. IBM-Inspired Theme

- **Colors:** `#0F62FE` (IBM Blue), `#161616` (near black), `#F4F4F4` (light bg), `#FFFFFF`
- **Typography:** IBM Plex Sans (body), IBM Plex Mono (code blocks)
- **Layout:** generous whitespace, grid-based, minimal decorative elements
- **Components:** flat cards, subtle borders, no shadows, high contrast

---

## 12. E-E-A-T Compliance Pages (Required for AdSense)

- `/about` — author identity, role, resume, blog purpose
- `/contact` — contact form or email
- `/privacy` — must declare: Google AdSense usage, cookies, third-party vendors
