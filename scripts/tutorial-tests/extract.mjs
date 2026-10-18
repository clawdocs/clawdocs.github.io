#!/usr/bin/env node
// extract.mjs: print the runnable parts of a docs page as JSON.
//
//   node scripts/tutorial-tests/extract.mjs docs/getting-started/quick-start.md
//
// Output: { page, title, commands: [{ line, text }], blocks: [{ lang, title, line, body }] }
//   commands: every command line in bash/sh/shell/zsh/console blocks, with
//             `\` continuations joined, multi-line quoted strings kept
//             together (joined with "\n"), comment-only lines dropped and
//             trailing `# comments` stripped. `line` is the 1-based page line.
//   blocks:   every fenced block, with its `title="..."` and raw body.
//
// Used by lib.sh so tests run the page's own text instead of a copy.
// No dependencies.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function extractPage(file) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');

  const fm = /^---\n([\s\S]*?)\n---/.exec(src);
  const title = fm ? ((/^title:\s*"?(.*?)"?\s*$/m.exec(fm[1]) || [])[1] || '') : '';

  const SHELL = new Set(['bash', 'sh', 'shell', 'zsh', 'console']);
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(\s*)(`{3,}|~{3,})\s*([^\s`{]*)\s*(.*)$/.exec(lines[i]);
    if (!m) continue;
    const [, indent, fence, lang, meta] = m;
    const close = new RegExp(`^\\s*${fence[0] === '`' ? '`' : '~'}{${fence.length},}\\s*$`);
    const start = i;
    const body = [];
    for (i++; i < lines.length && !close.test(lines[i]); i++) {
      body.push(lines[i].startsWith(indent) ? lines[i].slice(indent.length) : lines[i].trimStart());
    }
    const t = (/title=(?:"([^"]*)"|'([^']*)'|(\S+))/.exec(meta) || []).slice(1).find((x) => x !== undefined) || '';
    blocks.push({ lang: lang.toLowerCase(), title: t, meta, line: start + 1, body: body.join('\n') });
  }

  // Quote state after scanning `s`, starting in state `q` ('' | "'" | '"').
  function scanQuotes(s, q) {
    for (let k = 0; k < s.length; k++) {
      const c = s[k];
      if (q === '"' && c === '\\') { k++; continue; }
      if (!q && c === '\\') { k++; continue; }
      if (q) { if (c === q) q = ''; continue; }
      if (c === '"' || c === "'") q = c;
    }
    return q;
  }

  // Strip a trailing ` # comment` that is outside quotes.
  function stripComment(s) {
    let q = '';
    for (let k = 0; k < s.length; k++) {
      const c = s[k];
      if (c === '\\' && q !== "'") { k++; continue; }
      if (q) { if (c === q) q = ''; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (c === '#' && (k === 0 || /\s/.test(s[k - 1]))) return s.slice(0, k).trimEnd();
    }
    return s;
  }

  const commands = [];
  for (const b of blocks) {
    if (!SHELL.has(b.lang)) continue;
    const body = b.body.split('\n');
    for (let k = 0; k < body.length; k++) {
      let text = body[k];
      if (b.lang === 'console') { if (!/^\s*\$ /.test(text)) continue; text = text.replace(/^\s*\$ /, ''); }
      if (!text.trim() || /^\s*#/.test(text)) continue;
      const line = b.line + 1 + k;
      let q = scanQuotes(text, '');
      while (k + 1 < body.length && (q || /\\\s*$/.test(text))) {
        if (q) { text += '\n' + body[++k]; }
        else { text = text.replace(/\\\s*$/, '') + ' ' + body[++k].trim(); }
        q = scanQuotes(text, '');
      }
      commands.push({ line, text: stripComment(text).trim() });
    }
  }

  // Inline `openclaw ...` code spans outside fences (tables, prose). Tests may
  // run these too, but they are not counted as "uncovered" when left out.
  const inline = [];
  const fenced = new Set();
  for (const b of blocks) for (let n = b.line; n <= b.line + b.body.split('\n').length + 1; n++) fenced.add(n);
  lines.forEach((l, idx) => {
    if (fenced.has(idx + 1)) return;
    for (const m of l.matchAll(/`(openclaw [^`]+)`/g)) inline.push({ line: idx + 1, text: m[1].trim() });
  });

  return { page: file, title, commands, inline, blocks };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) { console.error('usage: extract.mjs <page.md>'); process.exit(2); }
  process.stdout.write(JSON.stringify(extractPage(process.argv[2]), null, 2) + '\n');
}
