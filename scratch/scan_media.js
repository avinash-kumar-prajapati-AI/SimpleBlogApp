import fs from 'node:fs';
import path from 'node:path';

const envPath = path.join(process.cwd(), '.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
  });
}

const GITHUB_TOKEN = env.GITHUB_TOKEN;
const REPO_OWNER = env.GITHUB_REPO_OWNER ?? "avinash-kumar-prajapati-AI";
const REPO_NAME = env.GITHUB_REPO_NAME ?? "Blog-space";
const BRANCH = env.GITHUB_BRANCH ?? "main";
const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const GH_HEADERS = { Accept: "application/vnd.github.v3+json", "User-Agent": "scan", ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}) };

async function listDir(p) {
  const res = await fetch(`${BASE_URL}/contents/${p}?ref=${BRANCH}`, { headers: GH_HEADERS });
  if (!res.ok) { console.warn(`listDir failed ${p}: ${res.status}`); return []; }
  return res.json();
}

async function scan(p) {
  const items = await listDir(p);
  for (const item of items) {
    console.log(`${item.type === 'dir' ? '📁' : '📄'} ${item.path}`);
    if (item.type === 'dir') await scan(item.path);
  }
}

scan('media');
