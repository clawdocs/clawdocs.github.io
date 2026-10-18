#!/usr/bin/env node
// Summarise OpenClaw's published GitHub security advisories as Markdown.
//
// Usage:
//   node scripts/advisories.mjs                 # fetch with `gh api` (needs gh logged in)
//   GITHUB_TOKEN=... node scripts/advisories.mjs  # fetch with the REST API instead
//   node scripts/advisories.mjs --file adv.json   # read a saved JSON array / JSONL dump
//
// Prints: totals, counts by severity, counts by publication month, and a
// table of every critical-severity advisory. No dependencies.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const REPO = "openclaw/openclaw";
const SEVERITIES = ["critical", "high", "medium", "low"];

async function fetchWithToken(token) {
  const out = [];
  let url = `https://api.github.com/repos/${REPO}/security-advisories?state=published&per_page=100`;
  while (url) {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    out.push(...(await res.json()));
    const next = /<([^>]+)>;\s*rel="next"/.exec(res.headers.get("link") ?? "");
    url = next ? next[1] : null;
  }
  return out;
}

function fetchWithGh() {
  const raw = execFileSync(
    "gh",
    ["api", `repos/${REPO}/security-advisories?state=published&per_page=100`, "--paginate", "-q", ".[]"],
    { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 },
  );
  return parseDump(raw);
}

function parseDump(text) {
  const t = text.trim();
  if (t.startsWith("[")) return JSON.parse(t);
  return t.split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

function fixedIn(adv) {
  const parts = new Set();
  for (const v of adv.vulnerabilities ?? []) {
    const name = v.package?.name ?? "?";
    const patched = (v.patched_versions || "no patched version listed").replace(/^>=\s*/, "");
    parts.add(name === "openclaw" ? patched : `${name} ${patched}`);
  }
  return [...parts].join("; ") || "not listed";
}

function cvssLabel(score) {
  if (score == null) return "";
  if (score >= 9.0) return "Critical";
  if (score >= 7.0) return "High";
  if (score >= 4.0) return "Medium";
  if (score > 0) return "Low";
  return "None";
}

const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

async function main() {
  const fileArg = process.argv.indexOf("--file");
  let advisories;
  if (fileArg !== -1) advisories = parseDump(readFileSync(process.argv[fileArg + 1], "utf8"));
  else if (process.env.GITHUB_TOKEN) advisories = await fetchWithToken(process.env.GITHUB_TOKEN);
  else advisories = fetchWithGh();

  advisories = advisories.filter((a) => a.state === "published" || a.state === undefined);

  const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, 0]));
  const byMonth = new Map();
  for (const a of advisories) {
    bySeverity[a.severity] = (bySeverity[a.severity] ?? 0) + 1;
    const month = (a.published_at ?? "").slice(0, 7) || "unknown";
    if (!byMonth.has(month)) byMonth.set(month, Object.fromEntries(SEVERITIES.map((s) => [s, 0])));
    byMonth.get(month)[a.severity] = (byMonth.get(month)[a.severity] ?? 0) + 1;
  }

  const lines = [];
  lines.push(`Published advisories in ${REPO}: **${advisories.length}** (generated ${new Date().toISOString().slice(0, 10)})`);
  lines.push("");
  lines.push("| Severity | Count |", "|---|---|");
  for (const s of SEVERITIES) lines.push(`| ${s} | ${bySeverity[s] ?? 0} |`);
  lines.push("");
  lines.push("| Month published | Critical | High | Medium | Low | Total |", "|---|---|---|---|---|---|");
  for (const month of [...byMonth.keys()].sort()) {
    const c = byMonth.get(month);
    const total = SEVERITIES.reduce((n, s) => n + (c[s] ?? 0), 0);
    lines.push(`| ${month} | ${c.critical} | ${c.high} | ${c.medium} | ${c.low} | ${total} |`);
  }
  lines.push("");

  const critical = advisories
    .filter((a) => a.severity === "critical")
    .sort((a, b) => (a.published_at ?? "").localeCompare(b.published_at ?? ""));
  lines.push("| Published | Advisory | CVE | CVSS | Summary | Fixed in |", "|---|---|---|---|---|---|");
  for (const a of critical) {
    const v3 = a.cvss_severities?.cvss_v3?.score ?? a.cvss?.score ?? null;
    const v4 = a.cvss_severities?.cvss_v4?.score ?? null;
    const cvss =
      v3 != null
        ? `${v3} (${cvssLabel(v3)})`
        : v4 != null
          ? `${v4} (${cvssLabel(v4)}, CVSS 4.0)`
          : "not scored";
    lines.push(
      `| ${(a.published_at ?? "").slice(0, 10)} | [${a.ghsa_id}](${a.html_url}) | ${a.cve_id ?? "none"} | ${cvss} | ${esc(a.summary)} | ${esc(fixedIn(a))} |`,
    );
  }
  console.log(lines.join("\n"));
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
