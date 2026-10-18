#!/usr/bin/env node
// Print current GitHub stars, last push and archived status for the repos
// listed in scripts/ecosystem-repos.json, so ecosystem pages can be re-dated.
//
// Usage: node scripts/refresh-stars.mjs [--json] [owner/name ...]
// Auth:  uses GITHUB_TOKEN (or GH_TOKEN) if set; otherwise falls back to
//        `gh api` when the gh CLI is installed; otherwise unauthenticated
//        fetch (60 requests/hour).
// Node 24+, no dependencies.

import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const args = process.argv.slice(2);
const asJson = args.includes('--json');
let slugs = args.filter((a) => !a.startsWith('--'));
if (slugs.length === 0) {
  const list = JSON.parse(await readFile(new URL('./ecosystem-repos.json', import.meta.url), 'utf8'));
  slugs = list.repos;
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
let haveGh = false;
if (!token) {
  try { await run('gh', ['--version']); haveGh = true; } catch {}
}

async function getRepo(slug) {
  if (!token && haveGh) {
    try {
      const { stdout } = await run('gh', ['api', `repos/${slug}`]);
      return { status: 200, body: JSON.parse(stdout) };
    } catch (e) {
      const m = /HTTP (\d{3})/.exec(String(e.stderr || e.message));
      return { status: m ? Number(m[1]) : 0, body: null };
    }
  }
  const res = await fetch(`https://api.github.com/repos/${slug}`, {
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'clawdocs-refresh-stars',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  return { status: res.status, body: res.ok ? await res.json() : null };
}

const rows = [];
for (const slug of slugs) {
  const { status, body } = await getRepo(slug);
  if (!body) {
    rows.push({ slug, status, now: null, stars: null, forks: null, pushed: null, archived: null });
    continue;
  }
  rows.push({
    slug,
    status,
    now: body.full_name.toLowerCase() === slug.toLowerCase() ? null : body.full_name,
    stars: body.stargazers_count,
    forks: body.forks_count,
    pushed: body.pushed_at?.slice(0, 10) ?? null,
    archived: body.archived,
  });
}

const today = new Date().toISOString().slice(0, 10);
if (asJson) {
  console.log(JSON.stringify({ asOf: today, repos: rows }, null, 2));
} else {
  console.log(`# GitHub repo status as of ${today}`);
  console.log('| repo | stars | forks | last push | status |');
  console.log('|---|---:|---:|---|---|');
  for (const r of rows) {
    const status = r.stars === null
      ? `HTTP ${r.status || 'error'}`
      : [r.archived ? 'ARCHIVED' : 'ok', r.now ? `moved to ${r.now}` : ''].filter(Boolean).join(', ');
    console.log(`| ${r.slug} | ${r.stars ?? ''} | ${r.forks ?? ''} | ${r.pushed ?? ''} | ${status} |`);
  }
}
