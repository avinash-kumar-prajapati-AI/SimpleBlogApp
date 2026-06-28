/**
 * searchIndex.ts — build-time search index builder
 */
import type { Article } from "./parseArticles";

export interface SearchEntry {
  slug: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  modified_date: string;
  thumbnail?: string;
  readingTime: number;
}

export function buildSearchIndex(articles: Article[]): SearchEntry[] {
  return articles.map((a) => ({
    slug: a.slug,
    category: a.category,
    title: a.frontmatter.title,
    description: a.frontmatter.description,
    tags: a.frontmatter.tags,
    modified_date: a.frontmatter.modified_date,
    thumbnail: a.frontmatter.thumbnail,
    readingTime: a.readingTime,
  }));
}

/** Client-side filter over search index */
export function filterArticles(
  index: SearchEntry[],
  query: string
): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return index;

  if (q.startsWith("@tag ")) {
    const tag = q.slice(5).trim();
    return index.filter((a) =>
      a.tags.some((t) => t.toLowerCase().includes(tag))
    );
  }
  if (q.startsWith("@category ")) {
    const cat = q.slice(10).trim();
    return index.filter((a) => a.category.toLowerCase().includes(cat));
  }
  // plain text search title + description
  return index.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
  );
}
