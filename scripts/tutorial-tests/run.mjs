#!/usr/bin/env node
// run.mjs: run the tutorial tests and write the report.
//
//   node scripts/tutorial-tests/run.mjs [--strict] [--json <file>] [tests...]
//
// Runs every scripts/tutorial-tests/*.test.sh (or the ones given), one after
// another, each in its own sandbox HOME with its own Gateway. Writes
// tutorial-report.json and a Markdown summary (to $GITHUB_STEP_SUMMARY when
// set, else stdout). Exits 0 unless --strict or TUTORIALS_STRICT=1 and a page
// failed.

import { readdirSync, readFileSync, writeFileSync, appendFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const argv = process.argv.slice(2);
let strict = process.env.TUTORIALS_STRICT === '1';
let jsonOut = path.join(ROOT, 'tutorial-report.json');
const tests = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--strict') strict = true;
  else if (argv[i] === '--json') jsonOut = path.resolve(argv[++i]);
  else tests.push(path.resolve(argv[i]));
}
if (!tests.length) for (const f of readdirSync(HERE).sort()) if (f.endsWith('.test.sh')) tests.push(path.join(HERE, f));

const pin = readFileSync(path.join(ROOT, 'scripts/openclaw-version.txt'), 'utf8').trim();
const outDir = path.join(ROOT, 'tutorial-report');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const pages = [];
for (const t of tests) {
  const before = new Set(readdirSync(outDir));
  console.log(`\n### ${path.relative(ROOT, t)}`);
  const r = spawnSync('bash', [t], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, TT_OUT: outDir }, timeout: 20 * 60 * 1000 });
  const fresh = readdirSync(outDir).filter((f) => !before.has(f) && f.endsWith('.json'));
  if (fresh.length) {
    for (const f of fresh) pages.push({ test: path.relative(ROOT, t), ...JSON.parse(readFileSync(path.join(outDir, f), 'utf8')) });
  } else {
    pages.push({ test: path.relative(ROOT, t), page: path.relative(ROOT, t), title: '', ok: false, passed: 0, failed: 1, skipped: 0,
      steps: [{ kind: 'setup', status: 'fail', cmd: 'test script', reason: `exited ${r.status ?? r.signal} without a result` }], uncovered: [] });
  }
}

const runUrl = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : null;
const date = new Date().toISOString().slice(0, 10);
const report = { openclaw: pin, date, run: runUrl, ok: pages.every((p) => p.ok), pages };
writeFileSync(jsonOut, JSON.stringify(report, null, 2) + '\n');

// ---------------------------------------------------------------- summary
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const short = (s, n = 110) => { s = esc(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
let md = `## Tutorial tests (OpenClaw ${pin})\n\n`;
md += `Commands from each page, run in order against a real Gateway on this runner. Report only. See scripts/README.md.\n\n`;
md += `| Page | Result | Steps run | Skipped | Failed | Unmapped |\n|---|---|---|---|---|---|\n`;
for (const p of pages) {
  md += `| \`${esc(p.page)}\` | ${p.ok ? 'pass' : '**FAIL**'} | ${p.passed + p.failed} | ${p.skipped} | ${p.failed} | ${p.uncovered.length} |\n`;
}
for (const p of pages) {
  md += `\n<details><summary><b>${esc(p.page)}</b>: ${p.ok ? 'pass' : 'FAIL'}, ${p.passed} passed, ${p.failed} failed, ${p.skipped} skipped</summary>\n\n`;
  md += `| | Line | Step | Note |\n|---|---|---|---|\n`;
  for (const s of p.steps) {
    md += `| ${s.status} | ${s.line ? 'L' + s.line : s.kind} | \`${short(s.cmd)}\` | ${short(s.reason, 200)} |\n`;
  }
  if (p.uncovered.length) {
    md += `\nPage commands this test neither runs nor skips:\n\n`;
    for (const u of p.uncovered) md += `- L${u.line} \`${short(u.text)}\`\n`;
  }
  if (p.ok) {
    md += `\nFront matter for this page:\n\n\`\`\`yaml\nci_verified:\n  version: ${pin}\n  date: ${date}\n  steps: ${p.passed}\n\`\`\`\n`;
  }
  md += `\n</details>\n`;
}
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
else console.log('\n' + md);

const failed = pages.filter((p) => !p.ok);
console.log(`\n${pages.length - failed.length}/${pages.length} pages passed. Report: ${path.relative(ROOT, jsonOut)}`);
process.exit(strict && failed.length ? 1 : 0);
