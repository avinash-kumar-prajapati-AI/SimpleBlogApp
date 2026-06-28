/**
 * parseArticles.ts — pure-JS frontmatter parser + article types
 * No gray-matter / no Node.js built-ins — safe in Cloudflare Workers
 */
import { marked } from "marked";

export interface ArticleFrontmatter {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  modified_date: string;
  external_links?: Array<{ label: string; url: string }>;
  thumbnail?: string;
  draft?: boolean;
}

export interface Article {
  slug: string;
  category: string;
  frontmatter: ArticleFrontmatter;
  html: string;
  readingTime: number;
}

// ── Pure-JS YAML subset parser ────────────────────────
// Handles: strings, quoted strings, booleans, numbers,
//          inline arrays [a, b, c], block arrays (- item),
//          nested objects (two-space indent key: value)

function parseYamlValue(raw: string): unknown {
  const v = raw.trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null" || v === "~") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; // keep date as string
  if (!isNaN(Number(v)) && v !== "") return Number(v);
  // Quoted string
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  // Inline array
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map((s) => parseYamlValue(s.trim()))
      .filter((s) => s !== "");
  }
  return v;
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = raw.match(FM_RE);
  if (!match) return { data: {}, content: raw };

  const yamlBlock = match[1];
  const content = match[2] ?? "";
  const data: Record<string, unknown> = {};

  const lines = yamlBlock.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Skip blank / comment lines
    if (!line.trim() || line.trim().startsWith("#")) { i++; continue; }

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) { i++; continue; }

    const key = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();

    if (rest === "") {
      // Block sequence: next lines starting with "  - "
      const items: unknown[] = [];
      i++;
      while (i < lines.length) {
        const subLine = lines[i];
        if (subLine.match(/^\s+-\s+/)) {
          const itemRaw = subLine.replace(/^\s+-\s+/, "").trim();
          // Check if item has sub-keys (nested obj)
          if (itemRaw.includes(":")) {
            const obj: Record<string, unknown> = {};
            const [k, ...vs] = itemRaw.split(":");
            obj[k.trim()] = parseYamlValue(vs.join(":").trim());
            // Gather additional sub-lines for this block item
            i++;
            while (i < lines.length && lines[i].match(/^\s{4,}\S/)) {
              const sub = lines[i];
              const ci = sub.indexOf(":");
              if (ci !== -1) {
                const sk = sub.slice(0, ci).trim();
                const sv = sub.slice(ci + 1).trim();
                obj[sk] = parseYamlValue(sv);
              }
              i++;
            }
            items.push(obj);
          } else {
            items.push(parseYamlValue(itemRaw));
            i++;
          }
        } else if (subLine.match(/^\s+\S/) && !subLine.match(/^\s+-/)) {
          // Indented non-array line — belongs to last block item
          i++;
        } else {
          break;
        }
      }
      data[key] = items;
    } else {
      data[key] = parseYamlValue(rest);
      i++;
    }
  }

  return { data, content };
}

// ─────────────────────────────────────────────────────

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function parseArticle(raw: string, slug: string, category: string): Article {
  const { data, content } = parseFrontmatter(raw);
  const fm = data as Record<string, unknown>;

  const frontmatter: ArticleFrontmatter = {
    id: String(fm.id ?? slug),
    title: String(fm.title ?? slug),
    description: String(fm.description ?? ""),
    tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
    category: String(fm.category ?? category),
    modified_date: String(fm.modified_date ?? new Date().toISOString().slice(0, 10)),
    external_links: Array.isArray(fm.external_links)
      ? (fm.external_links as Array<{ label: string; url: string }>)
      : undefined,
    thumbnail: fm.thumbnail ? String(fm.thumbnail) : undefined,
    draft: Boolean(fm.draft ?? false),
  };

  const html = marked(content) as string;
  const readingTime = estimateReadingTime(content);

  return { slug, category, frontmatter, html, readingTime };
}
