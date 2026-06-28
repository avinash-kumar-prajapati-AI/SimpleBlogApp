/**
 * github.ts — build-time content fetcher
 *
 * In dev (no GITHUB_TOKEN): reads from local blog_repo/ folder
 * In production/CI (GITHUB_TOKEN set): fetches from private GitHub repo
 *
 * All fetch/read happens at BUILD TIME only (output: static).
 * Node.js imports are top-level because this file only runs under Node.js
 * during Astro's build/dev prerender step — never in the Cloudflare Worker runtime.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN as string | undefined;
const REPO_OWNER = (import.meta.env.GITHUB_REPO_OWNER as string | undefined) ?? "avinash1954";
const REPO_NAME = (import.meta.env.GITHUB_REPO_NAME as string | undefined) ?? "blogAvinash";
const BRANCH = (import.meta.env.GITHUB_BRANCH as string | undefined) ?? "main";

const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const GH_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "AvinashBlog-AstroSSG",
  ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
};

const BLOG_REPO_ROOT = join(process.cwd(), "blog_repo");
const USE_LOCAL = !GITHUB_TOKEN && existsSync(join(BLOG_REPO_ROOT, "articles"));

// ── Local helpers ────────────────────────────────────

function localPath(relPath: string) {
  return join(BLOG_REPO_ROOT, relPath.replace(/\//g, "\\"));
}

function localRead(relPath: string): string {
  return readFileSync(localPath(relPath), "utf-8");
}

function localList(relPath: string): Array<{ name: string; type: "file" | "dir"; path: string }> {
  const fullPath = localPath(relPath);
  if (!existsSync(fullPath)) return [];
  return readdirSync(fullPath)
    .filter((n) => !n.startsWith("."))
    .map((name) => ({
      name,
      type: (statSync(join(fullPath, name)).isDirectory() ? "dir" : "file") as "dir" | "file",
      path: relPath.replace(/\/$/, "") + "/" + name,
    }));
}

// ── Remote helpers ────────────────────────────────────

function rawUrl(path: string) {
  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${path}`;
}

// ── Public API ────────────────────────────────────────

export async function fetchFileContent(path: string): Promise<string> {
  if (USE_LOCAL) return localRead(path);
  const res = await fetch(rawUrl(path), { headers: GH_HEADERS });
  if (!res.ok) throw new Error(`GitHub fetch failed: ${path} (${res.status})`);
  return res.text();
}

export async function listDir(
  path: string
): Promise<Array<{ name: string; type: "file" | "dir"; path: string }>> {
  if (USE_LOCAL) return localList(path);
  const res = await fetch(`${BASE_URL}/contents/${path}?ref=${BRANCH}`, { headers: GH_HEADERS });
  if (!res.ok) { console.warn(`GitHub listDir failed: ${path} (${res.status})`); return []; }
  const data = (await res.json()) as Array<{ name: string; type: string; path: string }>;
  return data.map((d) => ({ name: d.name, type: d.type as "file" | "dir", path: d.path }));
}

export async function fetchJson<T>(path: string): Promise<T> {
  return JSON.parse(await fetchFileContent(path)) as T;
}

export async function fetchAllArticles(): Promise<
  Array<{ category: string; slug: string; raw: string }>
> {
  const entries = await listDir("articles");
  const cats = entries.filter((e) => e.type === "dir");
  const results: Array<{ category: string; slug: string; raw: string }> = [];
  for (const cat of cats) {
    const files = await listDir(cat.path);
    for (const file of files) {
      if (file.name.endsWith(".md")) {
        const slug = file.name.replace(/\.md$/, "");
        const raw = await fetchFileContent(file.path);
        results.push({ category: cat.name, slug, raw });
      }
    }
  }
  return results;
}

export async function fetchVisibility(): Promise<{ visible: string[]; sidebarPicks: string[] }> {
  try {
    const raw = await fetchFileContent("articles/visibility.txt");
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    const vi = lines.indexOf("[visible]");
    const si = lines.indexOf("[sidebar]");
    const visible = vi >= 0 ? lines.slice(vi + 1, si >= 0 ? si : undefined) : [];
    const sidebarPicks = si >= 0 ? lines.slice(si + 1) : [];
    return { visible, sidebarPicks };
  } catch {
    return { visible: [], sidebarPicks: [] };
  }
}

export async function fetchDrafts(): Promise<Set<string>> {
  try {
    const raw = await fetchFileContent("articles/drafts.txt");
    return new Set(raw.split("\n").map((l) => l.trim()).filter(Boolean));
  } catch {
    return new Set<string>();
  }
}
