#!/usr/bin/env node
// check-snippets.mjs: copy-paste snippet gates for clawdocs.org.
//
// Scans docs/**/*.md(x) and reports, per page, snippets that would not work
// when pasted:
//   1. config:   json/json5/jsonc blocks meant for openclaw.json, validated
//                with the pinned OpenClaw (`openclaw config validate --json`)
//   2. commands: `openclaw <sub> [<sub2> ...]` lines in shell blocks; the
//                subcommand path must exist and every --flag must appear in
//                that path's --help
//   3. installs: npx / npm i / pnpm add|dlx / bunx / pip install / uvx /
//                pipx install / openclaw plugins install / clawhub install
//                targets (and MCP `command: "npx", args: [...]` stanzas) must
//                be listed in scripts/install-allowlist.json
//
// No dependencies. JSON5 parsing is left to OpenClaw itself.
// See scripts/README.md for the detection heuristics and the skip markers.
//
// Usage: node scripts/check-snippets.mjs [--strict] [--json <file>]
//          [--only config,commands,installs] [--network] [paths...]
// Env:   OPENCLAW_BIN      path to the openclaw binary (default: tools/openclaw/node_modules/.bin/openclaw, then PATH)
//        SNIPPETS_STRICT=1 same as --strict
//        SNIPPETS_CONCURRENCY  parallel openclaw processes (default 6)

import { readFile, writeFile, readdir, mkdtemp, rm, appendFile, mkdir, stat } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = path.join(ROOT, 'scripts');

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const opts = { strict: process.env.SNIPPETS_STRICT === '1', json: 'snippet-report.json', only: null, network: false, paths: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--strict') opts.strict = true;
  else if (a === '--json') opts.json = argv[++i];
  else if (a === '--only') opts.only = new Set(argv[++i].split(','));
  else if (a === '--network') opts.network = true;
  else if (a === '-h' || a === '--help') {
    console.log('Usage: node scripts/check-snippets.mjs [--strict] [--json <file>] [--only config,commands,installs] [--network] [paths...]');
    process.exit(0);
  } else opts.paths.push(a);
}
const want = (k) => !opts.only || opts.only.has(k);
const CONCURRENCY = Number(process.env.SNIPPETS_CONCURRENCY || 6);

// ---------------------------------------------------------------- openclaw
function resolveBin() {
  if (process.env.OPENCLAW_BIN) return process.env.OPENCLAW_BIN;
  const local = path.join(ROOT, 'tools/openclaw/node_modules/.bin/openclaw');
  if (existsSync(local)) return local;
  return 'openclaw';
}
const OPENCLAW = resolveBin();
const PIN = (await readFile(path.join(SCRIPTS, 'openclaw-version.txt'), 'utf8')).trim();

// Every openclaw process gets a throwaway HOME/state/config. Never a real home,
// never a gateway: we only run `--help`, `--version`, `config schema` and
// `config validate`.
const SANDBOX = await mkdtemp(path.join(tmpdir(), 'clawdocs-snippets-'));
process.on('exit', () => { try { rmSync(SANDBOX, { recursive: true, force: true }); } catch {} });

function sandboxEnv(dir) {
  return {
    PATH: process.env.PATH,
    HOME: dir,
    OPENCLAW_STATE_DIR: path.join(dir, 'state'),
    OPENCLAW_CONFIG_PATH: path.join(dir, 'openclaw.json'),
    OPENCLAW_DISABLE_UPDATE_CHECK: '1',
    NO_COLOR: '1',
    COLUMNS: '200',
    CI: '1',
  };
}

function run(args, dir = SANDBOX, timeout = 60000) {
  return new Promise((resolve) => {
    execFile(OPENCLAW, args, { env: sandboxEnv(dir), cwd: dir, timeout, maxBuffer: 32 << 20 }, (err, stdout, stderr) => {
      resolve({ code: err ? (typeof err.code === 'number' ? err.code : 1) : 0, stdout: String(stdout), stderr: String(stderr), error: err && typeof err.code !== 'number' ? err.message : null });
    });
  });
}

// Tiny promise pool.
function limiter(n) {
  let active = 0; const q = [];
  const next = () => { if (active >= n || !q.length) return; active++; const { fn, res, rej } = q.shift(); fn().then(res, rej).finally(() => { active--; next(); }); };
  return (fn) => new Promise((res, rej) => { q.push({ fn, res, rej }); next(); });
}
const limit = limiter(CONCURRENCY);

// ---------------------------------------------------------------- markdown scan
async function listDocs(targets) {
  const out = [];
  async function walk(p) {
    const s = await stat(p);
    if (s.isDirectory()) { for (const e of (await readdir(p)).sort()) await walk(path.join(p, e)); }
    else if (/\.mdx?$/.test(p)) out.push(p);
  }
  for (const t of targets.length ? targets : [path.join(ROOT, 'docs')]) await walk(path.resolve(t));
  return out;
}

const SKIP_RE = /(?:<!--|\{\/\*)\s*snippet:skip\b([^]*?)(?:-->|\*\/\})/;

// Returns fenced blocks: { lang, meta, title, startLine (1-based line of the
// opening fence), lines: [{n, text}], skip: reason|null }
function extractBlocks(src) {
  const lines = src.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const m = /^(\s*)(`{3,}|~{3,})\s*([^\s`{]*)\s*(.*)$/.exec(lines[i]);
    if (!m) { i++; continue; }
    const [, indent, fence, lang, meta] = m;
    const start = i;
    const body = [];
    i++;
    while (i < lines.length && !new RegExp(`^\\s*${fence[0] === '`' ? '`' : '~'}{${fence.length},}\\s*$`).test(lines[i])) {
      body.push({ n: i + 1, text: lines[i].startsWith(indent) ? lines[i].slice(indent.length) : lines[i].trimStart() });
      i++;
    }
    i++; // closing fence
    const title = (/title=(?:"([^"]*)"|'([^']*)'|(\S+))/.exec(meta) || []).slice(1).find((x) => x !== undefined) || '';
    let skip = null;
    if (/(^|\s)nocheck(\s|$)/.test(meta)) skip = 'nocheck';
    for (let k = start - 1; k >= 0 && k >= start - 3; k--) {
      if (!lines[k].trim()) continue;
      const s = SKIP_RE.exec(lines[k]);
      if (s) skip = s[1].trim() || 'snippet:skip';
      break;
    }
    blocks.push({ lang: lang.toLowerCase(), meta, title, startLine: start + 1, lines: body, skip });
  }
  return blocks;
}

// ---------------------------------------------------------------- json5 light scanner
// Walks JSON5 text tracking strings and comments. Returns top-level keys of
// the outermost object, whether the text starts with `{`, and positions of
// any `...` / `…` elisions outside strings and comments.
function scanJson5(text) {
  const keys = []; const elisions = [];
  let depth = 0, i = 0, firstSig = null, expectKey = false, line = 1;
  while (i < text.length) {
    const c = text[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (c === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); const seg = text.slice(i, e < 0 ? text.length : e); line += (seg.match(/\n/g) || []).length; i = e < 0 ? text.length : e + 2; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (firstSig === null) firstSig = c;
    if (c === '"' || c === "'") {
      let j = i + 1, s = '';
      while (j < text.length && text[j] !== c) { if (text[j] === '\\') { s += text[j + 1]; j += 2; continue; } if (text[j] === '\n') line++; s += text[j]; j++; }
      if (depth === 1 && expectKey && /^\s*:/.test(text.slice(j + 1))) keys.push(s);
      expectKey = false; i = j + 1; continue;
    }
    if (c === '.' && text.startsWith('...', i)) { elisions.push(line); i += 3; continue; }
    if (c === '…') { elisions.push(line); i++; continue; }
    if (c === '{' || c === '[') { depth++; expectKey = c === '{' && depth === 1; i++; continue; }
    if (c === '}' || c === ']') { depth--; i++; continue; }
    if (c === ',') { expectKey = depth === 1; i++; continue; }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (j < text.length && /[\w$]/.test(text[j])) j++;
      if (depth === 1 && expectKey && /^\s*:/.test(text.slice(j))) keys.push(text.slice(i, j));
      expectKey = false; i = j; continue;
    }
    expectKey = false; i++;
  }
  return { keys, startsWithBrace: firstSig === '{', empty: firstSig === null, elisions };
}

// ---------------------------------------------------------------- config gate
const ELISION_LINE = /^\s*(?:\/\/\s*)?(?:\.\.\.|…)\s*(?:\/\/.*)?,?\s*$/;
const CONFIG_TITLE = /openclaw\.json|openclaw[^"]*config\.json5?/i;
const OTHER_FILE_TITLE = /\.(?:jsonc?|json5|ya?ml|toml)\b/i;

function classifyConfig(block, rootKeys) {
  if (!['json', 'json5', 'jsonc'].includes(block.lang)) return null;
  const titled = CONFIG_TITLE.test(block.title);
  if (!titled && OTHER_FILE_TITLE.test(block.title)) return null;
  const kept = block.lines.filter((l) => !ELISION_LINE.test(l.text));
  let text = kept.map((l) => l.text).join('\n');
  let scan = scanJson5(text);
  let wrapped = false;
  if (!scan.startsWithBrace && titled && !scan.empty) { text = `{\n${text}\n}`; wrapped = true; scan = scanJson5(text); }
  if (!scan.startsWithBrace) return titled ? { titled, text, skip: 'not a JSON object' } : null;
  const rootHits = scan.keys.filter((k) => rootKeys.has(k));
  // Heuristic: titled as openclaw.json, or at least one top-level key is an
  // OpenClaw config root key from the pinned schema.
  if (!titled && rootHits.length === 0) return { unclassified: true, keys: scan.keys };
  const res = { titled, text, keys: scan.keys, wrapped, elidedLines: block.lines.length - kept.length };
  if (scan.elisions.length) res.skip = `inline "..." elision (block line ${scan.elisions[0] - (wrapped ? 1 : 0)})`;
  return res;
}

async function validateConfig(text) {
  return limit(async () => {
    const dir = await mkdtemp(path.join(SANDBOX, 'cfg-'));
    await writeFile(path.join(dir, 'openclaw.json'), text);
    const r = await run(['config', 'validate', '--json'], dir);
    await rm(dir, { recursive: true, force: true });
    const out = r.stdout;
    const j = out.indexOf('{');
    try {
      const parsed = JSON.parse(out.slice(j));
      return { valid: parsed.valid === true, issues: parsed.issues || [], warnings: parsed.warnings || [] };
    } catch {
      return { valid: false, issues: [{ path: '<cli>', message: `could not parse validate output: ${(r.stderr || out || r.error || '').trim().split('\n')[0]}` }], warnings: [] };
    }
  });
}

// ---------------------------------------------------------------- shell parsing
const SHELL_LANGS = new Set(['bash', 'sh', 'shell', 'console', 'zsh', 'shell-session', 'shellsession', 'powershell', 'ps1']);

// Split a shell line into tokens; operators become {op}. Quotes are honoured,
// `#` comments are dropped.
function tokenize(line) {
  const toks = []; let cur = null; let i = 0;
  const push = () => { if (cur !== null) { toks.push(cur); cur = null; } };
  while (i < line.length) {
    const c = line[i];
    if (c === ' ' || c === '\t') { push(); i++; continue; }
    if (c === '#' && cur === null) break;
    if (c === "'") { const e = line.indexOf("'", i + 1); cur = { word: (cur?.word || '') + line.slice(i + 1, e < 0 ? undefined : e), quoted: true }; i = e < 0 ? line.length : e + 1; continue; }
    if (c === '"') {
      let j = i + 1, s = '';
      while (j < line.length && line[j] !== '"') { if (line[j] === '\\') { s += line[j + 1] ?? ''; j += 2; continue; } s += line[j]; j++; }
      cur = { word: (cur?.word || '') + s, quoted: true }; i = j + 1; continue;
    }
    if (c === '\\') { cur = { word: (cur?.word || '') + (line[i + 1] ?? ''), quoted: cur?.quoted }; i += 2; continue; }
    const two = line.slice(i, i + 2);
    if (two === '&&' || two === '||' || two === '$(') { push(); toks.push({ op: two }); i += 2; continue; }
    if ('|;&()`'.includes(c)) { push(); toks.push({ op: c }); i++; continue; }
    if (c === '>' || c === '<') { push(); toks.push({ op: 'redir' }); i++; while (line[i] === '>' || line[i] === '&' || line[i] === '<') i++; continue; }
    cur = { word: (cur?.word || '') + c, quoted: cur?.quoted }; i++;
  }
  push();
  // drop redirect targets
  const out = [];
  for (let k = 0; k < toks.length; k++) {
    if (toks[k].op === 'redir') { if (toks[k + 1] && toks[k + 1].word !== undefined) k++; continue; }
    out.push(toks[k]);
  }
  return out;
}

// Yield logical command lines {n, text} from a shell block: prompts stripped,
// continuations joined, heredoc bodies skipped.
function shellLines(block) {
  const res = []; let buf = null; let heredoc = null;
  const consoleMode = block.lang === 'console' || block.lang === 'shell-session' || block.lang === 'shellsession';
  for (const { n, text } of block.lines) {
    if (heredoc) { if (text.trim() === heredoc) heredoc = null; continue; }
    let t = text;
    if (buf === null) {
      const p = /^\s*(?:[\w@.-]*[$%>]|\$|PS [^>]*>)\s+/.exec(t);
      if (p && /[$>%]\s+$/.test(p[0])) t = t.slice(p[0].length);
      else if (consoleMode) continue; // output line
    }
    const cont = /\\\s*$/.test(t);
    if (cont) t = t.replace(/\\\s*$/, ' ');
    if (buf) buf.text += ' ' + t.trim(); else buf = { n, text: t };
    const hd = /<<-?\s*['"]?([A-Za-z_]\w*)['"]?/.exec(t);
    if (hd) heredoc = hd[1];
    if (!cont) { res.push(buf); buf = null; }
  }
  if (buf) res.push(buf);
  return res;
}

// Split tokens into simple commands (word arrays) at operators.
function simpleCommands(toks) {
  const cmds = []; let cur = [];
  for (const t of toks) {
    if (t.op) { if (cur.length) cmds.push(cur); cur = []; continue; }
    cur.push(t);
  }
  if (cur.length) cmds.push(cur);
  return cmds;
}

const PREFIX = new Set(['sudo', 'env', 'time', 'nohup', 'exec', 'command', 'nice', 'caffeinate', 'then', 'do', 'else', 'if', 'while', 'until', '!', 'eval']);
// Strip env assignments and wrapper commands; returns remaining words.
function unwrap(words) {
  let w = words.map((t) => t.word);
  for (let guard = 0; guard < 10 && w.length; guard++) {
    if (/^[A-Za-z_]\w*=/.test(w[0])) { w = w.slice(1); continue; }
    if (PREFIX.has(w[0])) {
      w = w.slice(1);
      while (w.length && w[0].startsWith('-')) { const f = w.shift(); if (/^-(u|g|C|n)$/.test(f)) w.shift(); }
      continue;
    }
    if (w[0] === 'timeout' || w[0] === 'watch') { w = w.slice(1); while (w.length && (w[0].startsWith('-') || /^\d/.test(w[0]))) { const f = w.shift(); if (f === '-n') w.shift(); } continue; }
    if (w[0] === 'docker' || w[0] === 'podman') {
      let k = 1;
      if (w[k] === 'compose') k++;
      if (w[k] !== 'exec') return w;
      k++;
      while (k < w.length && w[k].startsWith('-')) { if (/^-(u|e|w|-user|-env|-workdir)$/.test(w[k])) k++; k++; }
      w = w.slice(k + 1); // skip container/service name
      continue;
    }
    break;
  }
  return w;
}

// ---------------------------------------------------------------- command gate
const GLOBAL_VALUE_OPTS = new Set(['--profile', '--container', '--log-level']);
const helpCache = new Map();
const pluginDirs = new Map();
// Some commands come from bundled plugins that are disabled by default; their
// --help then says `provided by the "<id>" plugin`. We re-run such paths in a
// sandbox whose config enables just that plugin.
function pluginSandbox(id) {
  if (!pluginDirs.has(id)) {
    pluginDirs.set(id, (async () => {
      const dir = path.join(SANDBOX, `plugin-${id.replace(/[^\w-]/g, '_')}`);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, 'openclaw.json'), JSON.stringify({ plugins: { entries: { [id]: { enabled: true } } } }));
      return dir;
    })());
  }
  return pluginDirs.get(id);
}
// `extra` adds arguments before --help: `channels add --channel telegram --help`
// lists that channel's own flags, which plain `channels add --help` does not.
function getHelp(pathArr, plugin = null, extra = []) {
  const key = (plugin ? `[${plugin}] ` : '') + [...pathArr, ...extra].join(' ');
  if (!helpCache.has(key)) {
    helpCache.set(key, (async () => {
      const dir = plugin ? await pluginSandbox(plugin) : SANDBOX;
      return limit(async () => {
        const r = await run([...pathArr, ...extra, '--help'], dir);
        const all = r.stdout + '\n' + r.stderr;
        const unknown = /does not know the command|has no command|unknown command/i.test(all);
        const providedBy = plugin ? null : (/provided by the "([^"]+)" plugin/.exec(all) || [])[1] || null;
        return { unknown, providedBy, path: pathArr.join(' '), plugin, text: r.stdout, code: r.code, commands: parseSection(r.stdout, 'Commands'), flags: parseFlags(r.stdout) };
      });
    })());
  }
  return helpCache.get(key);
}
function parseSection(text, name) {
  const lines = text.split('\n'); const out = new Set(); let on = false;
  for (const l of lines) {
    if (new RegExp(`^${name}:`).test(l)) { on = true; continue; }
    if (on && /^\S/.test(l)) on = false;
    if (!on) continue;
    const m = /^ {2}([a-z][\w:-]*(?:\|[\w:-]+)*)\*?(?:\s|$)/.exec(l);
    if (m && !/^Hint/.test(m[1])) for (const n of m[1].split('|')) out.add(n);
  }
  return out;
}
function parseFlags(text) {
  const out = new Set(); let on = false;
  for (const l of text.split('\n')) {
    if (/^Options:/.test(l)) { on = true; continue; }
    if (on && /^\S/.test(l)) on = false;
    if (!on) continue;
    for (const m of l.matchAll(/(?:^|[\s,])(--[a-z0-9][a-z0-9-]*)/gi)) out.add(m[1]);
  }
  return out;
}

const WORD = /^[a-z][a-z0-9:_-]*$/i;
async function checkOpenclawInvocation(args) {
  // args: words after `openclaw`
  let k = 0;
  const root = await getHelp([]);
  while (k < args.length && args[k].startsWith('-')) { if (GLOBAL_VALUE_OPTS.has(args[k])) k++; k++; }
  const pathArr = []; let help = root; let plugin = null;
  while (k < args.length && WORD.test(args[k])) {
    const cand = args[k];
    let h = null;
    if (!help.commands.has(cand)) {
      if (help.commands.size === 0) break; // leaf: rest are positionals
      h = await getHelp([...pathArr, cand], plugin);
      if (h.unknown) return { path: [...pathArr, cand].join(' '), unknownCommand: true };
      if (h.providedBy) { plugin = h.providedBy; h = await getHelp([...pathArr, cand], plugin); if (h.unknown) return { path: [...pathArr, cand].join(' '), unknownCommand: true, plugin }; }
      else break; // parent accepts a positional here
    } else {
      h = await getHelp([...pathArr, cand], plugin);
      if (h.unknown) return { path: [...pathArr, cand].join(' '), unknownCommand: true, plugin };
    }
    pathArr.push(cand); help = h; k++;
  }
  const flags = new Set([...help.flags, ...root.flags]);
  const ci = args.findIndex((a, i) => i >= k && (a === '--channel' || a.startsWith('--channel=')));
  if (ci >= 0) {
    const v = args[ci].includes('=') ? args[ci].split('=')[1] : args[ci + 1];
    if (v && WORD.test(v)) for (const f of (await getHelp(pathArr, plugin, ['--channel', v])).flags) flags.add(f);
  }
  const unknownFlags = [];
  for (; k < args.length; k++) {
    const a = args[k];
    if (a === '--') break;
    if (!a.startsWith('--')) continue;
    const name = a.split('=')[0];
    if (!/^--[a-z0-9][a-z0-9-]*$/i.test(name)) continue; // placeholders, $VARS
    if (!flags.has(name) && !flags.has(name.replace(/^--no-/, '--'))) unknownFlags.push(name);
  }
  return { path: pathArr.join(' ') || '(root)', unknownCommand: false, unknownFlags, plugin };
}

// ---------------------------------------------------------------- install gate
const PLACEHOLDER = /^[<[{$]|^\.\.\.$|your|^my-|example|^(clawhub:)?@owner\//i;
function isLocal(t) { return /^(\.{1,2}\/|\/|~\/|\.$|file:|https?:|git\+|git@|github:)/.test(t) || /\.(tgz|zip|tar\.gz|whl|ts|js)$/.test(t); }
function npmName(spec) {
  let s = spec.replace(/^npm:/, '');
  if (s.startsWith('@')) { const i = s.indexOf('@', 1); return i > 0 ? s.slice(0, i) : s; }
  return s.split('@')[0];
}
// ClawHub refs may be scoped (@owner/slug) and carry @version: keep the scope.
function clawhubName(spec) {
  const s = spec.replace(/^clawhub:/, '');
  if (s.startsWith('@')) { const i = s.indexOf('@', 1); return i > 0 ? s.slice(0, i) : s; }
  return s.split('@')[0];
}
function pyName(spec) { return spec.split(/[\[=<>!~;@ ]/)[0].toLowerCase(); }

// Given the words of one simple command (already unwrapped), return install
// targets [{eco, name, raw, via}].
function installTargets(w) {
  const out = [];
  const add = (eco, raw, via) => {
    if (!raw || PLACEHOLDER.test(raw)) return;
    if (isLocal(raw)) return;
    const name = eco === 'pypi' ? pyName(raw) : eco === 'npm' ? npmName(raw) : clawhubName(raw);
    if (!name) return;
    out.push({ eco, name, raw, via });
  };
  const positionals = (arr, valueFlags = []) => {
    const res = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === '--') break;
      if (arr[i].startsWith('-')) { if (valueFlags.includes(arr[i])) i++; continue; }
      res.push(arr[i]);
    }
    return res;
  };
  const cmd = w[0]; const rest = w.slice(1);
  if (!cmd) return out;
  const base = path.basename(cmd);
  if (base === 'npx' || base === 'bunx') {
    // npx [-y] [-p pkg]... <pkg> [args]
    let i = 0; const pk = [];
    while (i < rest.length && rest[i].startsWith('-')) { if (rest[i] === '-p' || rest[i] === '--package') { pk.push(rest[i + 1]); i += 2; continue; } if (rest[i].startsWith('--package=')) pk.push(rest[i].slice(10)); i++; }
    for (const p of pk) add('npm', p, base);
    if (!pk.length && rest[i]) add('npm', rest[i], base);
  } else if ((base === 'npm' || base === 'pnpm' || base === 'yarn' || base === 'bun') && rest.length) {
    const sub = rest.find((x) => !x.startsWith('-'));
    const after = rest.slice(rest.indexOf(sub) + 1);
    if ((base === 'npm' && ['i', 'install', 'add', 'in', 'isntall'].includes(sub)) || (base !== 'npm' && sub === 'add')) {
      for (const p of positionals(after, ['--prefix', '--registry', '-C', '--dir'])) add('npm', p, `${base} ${sub}`);
    } else if ((base === 'pnpm' && sub === 'dlx') || (base === 'npm' && sub === 'exec') || (base === 'yarn' && sub === 'dlx')) {
      const p = positionals(after, ['--package', '-p'])[0]; add('npm', p, `${base} ${sub}`);
    }
  } else if (/^pip(3(\.\d+)?)?$/.test(base) || ((base === 'python' || base === 'python3') && rest[0] === '-m' && rest[1] === 'pip')) {
    const r = base.startsWith('python') ? rest.slice(2) : rest;
    if (r[0] === 'install') for (const p of positionals(r.slice(1), ['-r', '--requirement', '-c', '-e', '--index-url', '-i', '--extra-index-url', '-t', '--target'])) add('pypi', p, 'pip install');
  } else if (base === 'uv' && rest[0] === 'pip' && rest[1] === 'install') {
    for (const p of positionals(rest.slice(2), ['-r'])) add('pypi', p, 'uv pip install');
  } else if (base === 'uv' && rest[0] === 'tool' && rest[1] === 'install') {
    add('pypi', positionals(rest.slice(2))[0], 'uv tool install');
  } else if (base === 'uvx') {
    let i = 0; while (i < rest.length && rest[i].startsWith('-')) { if (rest[i] === '--from') { add('pypi', rest[i + 1], 'uvx --from'); i++; } i++; }
    if (!rest.includes('--from')) add('pypi', rest[i], 'uvx');
  } else if (base === 'pipx' && (rest[0] === 'install' || rest[0] === 'run')) {
    add('pypi', positionals(rest.slice(1), ['--spec', '--python'])[0], `pipx ${rest[0]}`);
  } else if (base === 'clawhub' && rest[0] === 'install') {
    add('clawhub', positionals(rest.slice(1), ['--version', '--dir'])[0], 'clawhub install');
  } else if (base === 'openclaw') {
    let r = rest; while (r.length && r[0].startsWith('-')) r = r.slice(GLOBAL_VALUE_OPTS.has(r[0]) ? 2 : 1);
    if ((r[0] === 'plugins' || r[0] === 'plugin') && r[1] === 'install') {
      if (r.includes('--marketplace')) return out;
      const spec = positionals(r.slice(2), ['--marketplace'])[0];
      if (spec) add(spec.startsWith('clawhub:') ? 'clawhub' : 'npm', spec, 'openclaw plugins install');
    } else if (r[0] === 'skills' && r[1] === 'install') {
      add('clawhub', positionals(r.slice(2))[0], 'openclaw skills install');
    }
  }
  return out;
}

// MCP-style `"command": "npx", "args": ["-y", "pkg"]` stanzas in any block.
function stanzaTargets(block) {
  const text = block.lines.map((l) => l.text).join('\n');
  const res = [];
  const re = /["']?command["']?\s*[:=]\s*["'](npx|bunx|uvx|pipx|pnpm)["']\s*,?\s*["']?args["']?\s*[:=]\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(text))) {
    const args = [...m[2].matchAll(/["']([^"']*)["']/g)].map((x) => x[1]);
    const lineIdx = text.slice(0, m.index).split('\n').length - 1;
    for (const t of installTargets([m[1], ...args])) res.push({ ...t, n: block.lines[lineIdx]?.n ?? block.startLine, via: `${t.via} (MCP command/args)` });
  }
  return res;
}

function matchKey(map, name) {
  if (!map) return null;
  if (map[name]) return { key: name, entry: map[name] };
  for (const k of Object.keys(map)) {
    if (k.endsWith('*') && name.startsWith(k.slice(0, -1))) return { key: k, entry: map[k] };
  }
  return null;
}

// ---------------------------------------------------------------- network (optional)
async function npmView(name) {
  return new Promise((resolve) => {
    execFile('npm', ['view', name, 'maintainers', 'repository.url', '--json'], { timeout: 30000 }, (err, stdout) => {
      if (err) return resolve({ exists: false });
      try {
        const j = JSON.parse(stdout);
        // npm prints a bare array when only one requested field is present.
        const m = Array.isArray(j) ? j : j.maintainers || [];
        resolve({ exists: true, maintainers: m.map((x) => String(typeof x === 'object' ? x.name : x).split(' ')[0]), repo: Array.isArray(j) ? undefined : j['repository.url'] });
      } catch { resolve({ exists: true }); }
    });
  });
}

// ---------------------------------------------------------------- main
async function main() {
  const t0 = Date.now();
  const files = await listDocs(opts.paths);
  const allow = JSON.parse(await readFile(path.join(SCRIPTS, 'install-allowlist.json'), 'utf8'));

  const ver = await run(['--version']);
  const actual = (/(\d{4}\.\d+\.\d+)/.exec(ver.stdout) || [])[1];
  if (!actual) { console.error(`check-snippets: cannot run ${OPENCLAW} (${ver.error || ver.stderr.trim()})`); process.exit(2); }
  if (actual !== PIN) console.error(`check-snippets: warning: openclaw ${actual} != pinned ${PIN}`);

  let rootKeys = new Set();
  if (want('config')) {
    const s = await run(['config', 'schema']);
    try { rootKeys = new Set(Object.keys(JSON.parse(s.stdout.slice(s.stdout.indexOf('{'))).properties || {})); }
    catch { console.error('check-snippets: could not read config schema'); process.exit(2); }
  }

  const pages = [];
  const tasks = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const src = await readFile(file, 'utf8');
    const page = { file: rel, config: { checked: 0, invalid: [], skipped: [], unclassified: 0 }, commands: { checked: 0, unknown: [], unknownFlags: [] }, installs: { checked: 0, unlisted: [], denied: [] }, skippedBlocks: 0 };
    pages.push(page);
    for (const b of extractBlocks(src)) {
      if (b.skip) { page.skippedBlocks++; continue; }
      if (want('config')) {
        const c = classifyConfig(b, rootKeys);
        if (c?.unclassified) page.config.unclassified++;
        else if (c?.skip) page.config.skipped.push({ line: b.startLine, reason: c.skip });
        else if (c) {
          page.config.checked++;
          tasks.push(validateConfig(c.text).then((r) => {
            const issues = r.issues.filter((x) => !/Failed to read include file/.test(x.message));
            if (r.issues.length && !issues.length) { page.config.checked--; page.config.skipped.push({ line: b.startLine, reason: '$include of a file not shown' }); return; }
            if (!r.valid) page.config.invalid.push({ line: b.startLine, issues: issues.map((x) => `${x.path}: ${x.message}`) });
          }));
        }
      }
      const isShell = SHELL_LANGS.has(b.lang);
      if (want('installs')) {
        for (const t of stanzaTargets(b)) { page.installs.checked++; judgeInstall(page, t, allow); }
      }
      if (!isShell) continue;
      for (const ln of shellLines(b)) {
        for (const words of simpleCommands(tokenize(ln.text))) {
          const w = unwrap(words);
          if (!w.length) continue;
          if (want('installs')) for (const t of installTargets(w)) { page.installs.checked++; judgeInstall(page, { ...t, n: ln.n }, allow); }
          if (!want('commands')) continue;
          let rest = null;
          if (path.basename(w[0]) === 'openclaw') rest = w.slice(1);
          else if (['npx', 'bunx'].includes(w[0]) && /^openclaw(@|$)/.test(w.find((x) => !x.startsWith('-')) || '')) rest = w.slice(w.findIndex((x) => /^openclaw(@|$)/.test(x)) + 1);
          else if (w[0] === 'pnpm' && w[1] === 'openclaw') rest = w.slice(2);
          if (!rest) continue;
          page.commands.checked++;
          tasks.push(checkOpenclawInvocation(rest).then((r) => {
            if (r.unknownCommand) page.commands.unknown.push({ line: ln.n, path: r.path, text: ln.text.trim() });
            else if (r.unknownFlags.length) page.commands.unknownFlags.push({ line: ln.n, path: r.path, flags: r.unknownFlags });
          }));
        }
      }
    }
  }
  await Promise.all(tasks);

  if (opts.network) {
    const names = [...new Set(pages.flatMap((p) => p.installs.unlisted.filter((u) => u.eco === 'npm').map((u) => u.name)))];
    const info = new Map(await Promise.all(names.map(async (n) => [n, await npmView(n)])));
    for (const p of pages) for (const u of p.installs.unlisted) if (info.has(u.name)) {
      const i = info.get(u.name);
      u.registry = i.exists ? `exists; maintainers: ${(i.maintainers || []).join(', ') || '?'}` : 'NOT on npm';
    }
    // Allowlist drift: allowlisted packages whose registry maintainers no longer match.
    const hits = await Promise.all([...allowHits].map(async ([n, e]) => [n, e, await npmView(n)]));
    networkNotes = hits.filter(([, e, i]) => !i.exists || (e.maintainers && i.maintainers && !i.maintainers.some((m) => e.maintainers.includes(m))))
      .map(([n, e, i]) => `\`${n}\`: ${i.exists ? `maintainers now ${i.maintainers.join(', ')}; allowlist expects ${e.maintainers.join(', ')}` : 'not found on npm'}`);
  }

  for (const p of pages) {
    for (const k of ['invalid', 'skipped']) p.config[k].sort((a, b) => a.line - b.line);
    for (const k of ['unknown', 'unknownFlags']) p.commands[k].sort((a, b) => a.line - b.line);
    for (const k of ['unlisted', 'denied']) p.installs[k].sort((a, b) => a.line - b.line);
    p.failures = p.config.invalid.length + p.commands.unknown.length + p.commands.unknownFlags.length + p.installs.unlisted.length + p.installs.denied.length;
  }

  const sum = (f) => pages.reduce((a, p) => a + f(p), 0);
  const distinct = new Map();
  for (const [k, v] of helpCache) distinct.set(k, await v);
  const totals = {
    openclaw: actual, pin: PIN,
    pages: pages.length,
    configChecked: sum((p) => p.config.checked), configInvalid: sum((p) => p.config.invalid.length), configSkipped: sum((p) => p.config.skipped.length), jsonUnclassified: sum((p) => p.config.unclassified),
    commandLines: sum((p) => p.commands.checked), commandPaths: [...distinct.keys()].filter((k) => k).length, unknownCommandPaths: [...distinct.entries()].filter(([k, v]) => k && v.unknown).length,
    unknownCommandLines: sum((p) => p.commands.unknown.length), unknownFlagLines: sum((p) => p.commands.unknownFlags.length), unknownFlags: sum((p) => p.commands.unknownFlags.reduce((a, x) => a + x.flags.length, 0)),
    installsChecked: sum((p) => p.installs.checked), installsUnlisted: sum((p) => p.installs.unlisted.length), installsDenied: sum((p) => p.installs.denied.length),
    skippedBlocks: sum((p) => p.skippedBlocks),
    failures: sum((p) => p.failures),
    seconds: Math.round((Date.now() - t0) / 100) / 10,
  };

  const pathCounts = new Map();
  for (const p of pages) for (const u of p.commands.unknown) pathCounts.set(u.path, (pathCounts.get(u.path) || 0) + 1);
  totals.unknownPaths = Object.fromEntries([...pathCounts].sort((a, b) => b[1] - a[1]));
  const md = renderMarkdown(pages, totals);
  process.stdout.write(md);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, md);
  if (opts.json) {
    const out = path.resolve(opts.json);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, JSON.stringify({ totals, pages: pages.filter((p) => p.failures || p.config.skipped.length) }, null, 2) + '\n');
  }
  await rm(SANDBOX, { recursive: true, force: true });
  process.exitCode = opts.strict && totals.failures ? 1 : 0;
}

const allowHits = new Map();
let networkNotes = [];
function judgeInstall(page, t, allow) {
  const eco = allow[t.eco] || {};
  const deny = matchKey(allow.denied?.[t.eco], t.name);
  const entry = { line: t.n, eco: t.eco, name: t.name, via: t.via };
  if (deny) { page.installs.denied.push({ ...entry, reason: deny.entry.reason || deny.entry }); return; }
  const ok = matchKey(eco, t.name);
  if (ok) { if (t.eco === 'npm') allowHits.set(t.name, ok.entry); return; }
  page.installs.unlisted.push(entry);
}

function esc(s) { return String(s).replace(/\|/g, '\\|').replace(/`/g, "'").slice(0, 160); }

function renderMarkdown(pages, t) {
  const L = [];
  L.push('## Snippet gates report', '');
  L.push(`OpenClaw \`${t.openclaw}\` (pin \`${t.pin}\`), ${t.pages} pages, ${t.seconds}s. Mode: ${opts.strict ? '**strict**' : 'report only'}.`, '');
  L.push('| Gate | Checked | Failing |', '|---|---:|---:|');
  L.push(`| Config blocks (openclaw.json) | ${t.configChecked} | ${t.configInvalid} |`);
  L.push(`| \`openclaw\` command lines | ${t.commandLines} | ${t.unknownCommandLines} unknown command, ${t.unknownFlagLines} with unknown flags (${t.unknownFlags} flags) |`);
  L.push(`| Distinct command paths | ${t.commandPaths} | ${t.unknownCommandPaths} unknown |`);
  L.push(`| Install targets | ${t.installsChecked} | ${t.installsUnlisted} unlisted, ${t.installsDenied} known-bad |`);
  L.push('', `Not counted: ${t.configSkipped} config blocks skipped (elisions/includes), ${t.jsonUnclassified} JSON blocks not recognised as openclaw.json, ${t.skippedBlocks} blocks opted out with \`snippet:skip\`/\`nocheck\`.`, '');
  L.push(`**Total failures: ${t.failures}**`, '');
  if (networkNotes.length) L.push('### Allowlist drift (--network)', '', ...networkNotes.map((x) => `- ${x}`), '');
  const bad = pages.filter((p) => p.failures).sort((a, b) => b.failures - a.failures || a.file.localeCompare(b.file));
  if (!bad.length) { L.push('All snippets pass.', ''); return L.join('\n') + '\n'; }
  if (Object.keys(t.unknownPaths).length) {
    L.push('### Unknown command paths', '', Object.entries(t.unknownPaths).map(([k, v]) => `\`openclaw ${k}\` (${v})`).join(', '), '');
  }
  L.push('### Pages by failures', '', '| Page | Config invalid | Unknown cmds | Unknown flags | Installs |', '|---|---:|---:|---:|---:|');
  for (const p of bad) L.push(`| ${p.file} | ${p.config.invalid.length}/${p.config.checked} | ${p.commands.unknown.length} | ${p.commands.unknownFlags.length} | ${p.installs.unlisted.length + p.installs.denied.length} |`);
  L.push('');
  for (const p of bad) {
    L.push(`<details><summary><b>${p.file}</b>: ${p.failures} failing</summary>`, '');
    for (const c of p.config.invalid) L.push(`- \`${p.file}:${c.line}\` config invalid: ${esc(c.issues[0] || 'invalid')}${c.issues.length > 1 ? ` (+${c.issues.length - 1} more)` : ''}`);
    for (const c of p.commands.unknown) L.push(`- \`${p.file}:${c.line}\` unknown command \`openclaw ${esc(c.path)}\``);
    for (const c of p.commands.unknownFlags) L.push(`- \`${p.file}:${c.line}\` \`openclaw ${esc(c.path)}\`: unknown flag${c.flags.length > 1 ? 's' : ''} ${c.flags.map((f) => `\`${f}\``).join(', ')}`);
    for (const c of p.installs.denied) L.push(`- \`${p.file}:${c.line}\` KNOWN-BAD install \`${esc(c.name)}\` (${c.eco}, via ${c.via}): ${esc(c.reason)}`);
    for (const c of p.installs.unlisted) L.push(`- \`${p.file}:${c.line}\` unlisted install \`${esc(c.name)}\` (${c.eco}, via ${c.via})${c.registry ? `: ${c.registry}` : ''}`);
    L.push('', '</details>', '');
  }
  return L.join('\n') + '\n';
}

await main();
