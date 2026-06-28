/**
 * github.ts — build-time content fetcher
 *
 * Fetches content directly from the private GitHub repository at build time.
 * Parses local .env at build time for local dev token access.
 */

interface GithubConfig {
  token?: string;
  owner: string;
  repo: string;
  branch: string;
}

let cachedConfig: GithubConfig | null = null;

async function getLocalEnv(): Promise<Record<string, string>> {
  const env: Record<string, string> = {};
  try {
    const fsName = "node:fs";
    const pathName = "node:path";
    const { existsSync, readFileSync } = await import(/* @vite-ignore */ fsName);
    const { join } = await import(/* @vite-ignore */ pathName);
    const envPath = join(process.cwd(), ".env");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const parts = trimmed.split("=");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
          env[key] = val;
        }
      });
    }
  } catch {
    // fallback if fs not available
  }
  return env;
}

async function getConfig(): Promise<GithubConfig> {
  if (cachedConfig) return cachedConfig;

  const localEnv = await getLocalEnv();
  
  const token = (
    import.meta.env.GITHUB_TOKEN ||
    process.env.GITHUB_TOKEN ||
    localEnv.GITHUB_TOKEN
  ) as string | undefined;

  const owner = (
    import.meta.env.GITHUB_REPO_OWNER ||
    process.env.GITHUB_REPO_OWNER ||
    localEnv.GITHUB_REPO_OWNER ||
    "avinash-kumar-prajapati-AI"
  ) as string;

  const repo = (
    import.meta.env.GITHUB_REPO_NAME ||
    process.env.GITHUB_REPO_NAME ||
    localEnv.GITHUB_REPO_NAME ||
    "Blog-space"
  ) as string;

  const branch = (
    import.meta.env.GITHUB_BRANCH ||
    process.env.GITHUB_BRANCH ||
    localEnv.GITHUB_BRANCH ||
    "main"
  ) as string;

  cachedConfig = { token, owner, repo, branch };
  
  // Debug paths
  let exists = false;
  let cwd = "unknown";
  try {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    cwd = process.cwd();
    exists = existsSync(join(cwd, ".env"));
  } catch {}

  console.log(`[GitHub API] Configured with REPO=${owner}/${repo}, BRANCH=${branch}, TOKEN_LEN=${token ? token.length : 0}, CWD=${cwd}, ENV_EXISTS=${exists}`);
  return cachedConfig;
}

async function getHeaders(): Promise<Record<string, string>> {
  const config = await getConfig();
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "AvinashBlog-AstroSSG",
    ...(config.token ? { Authorization: `token ${config.token}` } : {}),
  };
}

async function rawUrl(path: string): Promise<string> {
  const config = await getConfig();
  return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${path}`;
}

async function decodeBase64(str: string): Promise<string> {
  try {
    return decodeURIComponent(
      atob(str.replace(/\s/g, ""))
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    const { Buffer } = await import("node:buffer");
    return Buffer.from(str, "base64").toString("utf-8");
  }
}

// ── Public API ─────────────────────────────────────────

/** Fetch text content of a file from the repository */
export async function fetchFileContent(path: string): Promise<string> {
  const config = await getConfig();
  const url = await rawUrl(path);
  const headers = await getHeaders();
  
  let res = await fetch(url, { headers });

  // Fallback to Contents API if raw URL is not found or fails
  if (!res.ok) {
    const apiRes = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
      { headers }
    );
    if (!apiRes.ok) {
      throw new Error(`Failed to fetch file content for ${path}. Raw status: ${res.status}, API status: ${apiRes.status}`);
    }
    const data = await apiRes.json() as { content?: string; encoding?: string };
    if (data.content && data.encoding === "base64") {
      return decodeBase64(data.content);
    }
    throw new Error(`File ${path} is not in expected base64 format`);
  }

  return res.text();
}

/** List items in a directory */
export async function listDir(
  path: string
): Promise<Array<{ name: string; type: "file" | "dir"; path: string }>> {
  const config = await getConfig();
  const headers = await getHeaders();
  
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`listDir failed for ${path} (${res.status})`);
    return [];
  }
  const data = (await res.json()) as Array<{ name: string; type: string; path: string }>;
  return data.map((d) => ({
    name: d.name,
    type: d.type as "file" | "dir",
    path: d.path,
  }));
}

/** Fetch and parse a JSON file */
export async function fetchJson<T>(path: string): Promise<T> {
  const raw = await fetchFileContent(path);
  return JSON.parse(raw) as T;
}

/** Fetch all article .md files across all category directories */
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
        try {
          const raw = await fetchFileContent(file.path);
          results.push({ category: cat.name, slug, raw });
        } catch (err) {
          console.error(`Failed to fetch article content for ${file.path}:`, err);
        }
      }
    }
  }
  return results;
}

/** Parse visibility.txt */
export async function fetchVisibility(): Promise<{
  visible: string[];
  sidebarPicks: string[];
}> {
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

/** Parse drafts.txt */
export async function fetchDrafts(): Promise<Set<string>> {
  try {
    const raw = await fetchFileContent("articles/drafts.txt");
    return new Set(raw.split("\n").map((l) => l.trim()).filter(Boolean));
  } catch {
    return new Set<string>();
  }
}
