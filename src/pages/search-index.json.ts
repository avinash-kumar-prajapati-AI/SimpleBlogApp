/**
 * search-index.json.ts — static endpoint that generates search-index.json at build time
 * No fs/path needed — Astro serializes the return value to /search-index.json
 */
import type { APIRoute } from "astro";
import { fetchAllArticles, fetchVisibility, fetchDrafts } from "../lib/github";
import { parseArticle } from "../lib/parseArticles";
import { buildSearchIndex } from "../lib/searchIndex";

export const prerender = true;

export const GET: APIRoute = async () => {
  let index = [];
  try {
    const [rawArticles, { visible }, drafts] = await Promise.all([
      fetchAllArticles(),
      fetchVisibility(),
      fetchDrafts(),
    ]);

    const articles = rawArticles
      .filter((r) => !drafts.has(r.slug))
      .map((r) => parseArticle(r.raw, r.slug, r.category))
      .filter((a) => !a.frontmatter.draft)
      .filter((a) => visible.length === 0 || visible.includes(a.category));

    index = buildSearchIndex(articles) as never;
  } catch (e) {
    console.warn("search-index.json.ts: fetch failed", e);
  }

  return new Response(JSON.stringify(index), {
    headers: { "Content-Type": "application/json" },
  });
};
