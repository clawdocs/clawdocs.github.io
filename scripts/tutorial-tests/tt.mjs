#!/usr/bin/env node
// tt.mjs: helpers for lib.sh (tutorial tests). Not meant to be run by hand.
//
//   tt.mjs resolve <page.json> <query> [steps.jsonl]    -> line, source, text of the page command
//   tt.mjs block   <page.json> <selector>   -> line, title, body of a fenced block
//   tt.mjs record  <steps.jsonl> <json>     -> append one step record
//   tt.mjs finish  <page.json> <steps.jsonl> <out.json> <version>
//
// Query: the command text as it appears on the page (whitespace-insensitive).
// A query ending in "..." matches the one page command that starts with it.
// Selector: "config:N" (Nth openclaw.json block on the page, 1-based) or
// "title:<exact fence title>".

import { readFileSync, appendFileSync, writeFileSync } from 'node:fs';

const [, , sub, ...args] = process.argv;
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const load = (f) => JSON.parse(readFileSync(f, 'utf8'));
const die = (msg) => { process.stderr.write(msg + '\n'); process.exit(1); };

if (sub === 'resolve') {
  const [pj, query, stepsFile] = args;
  const page = load(pj);
  let used = new Set();
  try { used = new Set(readFileSync(stepsFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).line)); } catch {}
  const all = [
    ...page.commands.map((c) => ({ ...c, source: 'fenced' })),
    ...page.inline.map((c) => ({ ...c, source: 'inline' })),
  ];
  const q = norm(query);
  let hits;
  if (/(\.\.\.|…)$/.test(q)) {
    const pre = q.replace(/(\.\.\.|…)$/, '').trimEnd();
    hits = all.filter((c) => norm(c.text).startsWith(pre));
    const uniq = new Set(hits.map((h) => norm(h.text)));
    if (uniq.size > 1) die(`ambiguous prefix, matches ${uniq.size} commands on ${page.page}: ${[...hits].map((h) => 'L' + h.line).join(', ')}`);
  } else {
    hits = all.filter((c) => norm(c.text) === q);
  }
  if (!hits.length) die(`not on page ${page.page}: ${query}`);
  // Repeated commands: take the first occurrence not already covered.
  hits = [...hits.filter((h) => !used.has(h.line)), ...hits];
  // line, source, then the command text (may span lines)
  process.stdout.write(`${hits[0].line}\n${hits[0].source}\n${hits[0].text}\n`);
} else if (sub === 'block') {
  const [pj, sel] = args;
  const page = load(pj);
  let b;
  if (sel.startsWith('config:')) {
    const n = Number(sel.slice(7));
    const cfg = page.blocks.filter((x) => ['json', 'json5', 'jsonc'].includes(x.lang) && /openclaw\.json/.test(x.title));
    b = cfg[n - 1];
    if (!b) die(`no openclaw.json block #${n} on ${page.page} (found ${cfg.length})`);
  } else if (sel.startsWith('title:')) {
    const t = sel.slice(6);
    const hits = page.blocks.filter((x) => x.title === t);
    if (hits.length !== 1) die(`expected one block titled "${t}" on ${page.page}, found ${hits.length}`);
    b = hits[0];
  } else die(`bad selector ${sel}`);
  // line, title, then the body
  process.stdout.write(`${b.line}\n${b.title}\n${b.body}\n`);
} else if (sub === 'record') {
  const [file, json] = args;
  appendFileSync(file, JSON.stringify(JSON.parse(json)) + '\n');
} else if (sub === 'finish') {
  const [pj, stepsFile, out, version] = args;
  const page = load(pj);
  let steps = [];
  try { steps = readFileSync(stepsFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch {}
  const covered = new Set(steps.filter((s) => s.line).map((s) => s.line));
  const uncovered = page.commands.filter((c) => !covered.has(c.line)).map((c) => ({ line: c.line, text: c.text }));
  const count = (st) => steps.filter((s) => s.status === st).length;
  const res = {
    page: page.page,
    title: page.title,
    openclaw: version,
    date: new Date().toISOString().slice(0, 10),
    passed: count('pass'),
    failed: count('fail'),
    skipped: count('skip'),
    ok: count('fail') === 0 && steps.length > 0,
    steps,
    uncovered,
  };
  writeFileSync(out, JSON.stringify(res, null, 2) + '\n');
  process.stdout.write(`${res.ok ? 'PASS' : 'FAIL'} ${page.page}: ${res.passed} passed, ${res.failed} failed, ${res.skipped} skipped, ${uncovered.length} page commands not mapped\n`);
  for (const u of uncovered) process.stdout.write(`  unmapped L${u.line}: ${u.text.split('\n')[0]}\n`);
} else {
  die('usage: tt.mjs resolve|block|record|finish ...');
}
