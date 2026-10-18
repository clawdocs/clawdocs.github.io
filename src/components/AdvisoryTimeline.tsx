// Security advisory timeline for /security/known-vulnerabilities.
//
// Data: static/data/openclaw-advisories.json, written by
// `node scripts/advisories.mjs --json static/data/openclaw-advisories.json`
// and refreshed weekly by .github/workflows/advisories.yml. The JSON is
// imported (not fetched) so the chart and table are in the static HTML.
// No window access at module scope; everything renders in SSR.

import React, {useMemo, useState} from 'react';
import data from '@site/static/data/openclaw-advisories.json';
import styles from './AdvisoryTimeline.module.css';

type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Advisory {
  ghsa_id: string;
  cve_id: string | null;
  severity: Severity;
  cvss: number | null;
  cvss_version: string | null;
  summary: string;
  published_at: string;
  patched: string[];
  patched_other: string[];
  html_url: string;
}

interface AdvisoryData {
  generatedAt: string;
  repo: string;
  advisories: Advisory[];
}

const DATA = data as AdvisoryData;
const ADVISORIES = DATA.advisories;

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];
const SEV_RANK: Record<Severity, number> = {critical: 0, high: 1, medium: 2, low: 3};
const SEV_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const day = (iso: string) => (iso ?? '').slice(0, 10);

export function compareVersions(a: string, b: string): number {
  const pa = a.split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  const pb = b.split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

function countBySeverity(list: Advisory[]): Record<Severity, number> {
  const c = {critical: 0, high: 0, medium: 0, low: 0};
  for (const a of list) c[a.severity] = (c[a.severity] ?? 0) + 1;
  return c;
}

function fixedInText(a: Advisory): string {
  const parts = [...a.patched, ...a.patched_other];
  return parts.length ? parts.join('; ') : 'not listed';
}

function cvssText(a: Advisory): string {
  if (a.cvss == null) return 'not scored';
  return a.cvss_version === '4.0' ? `${a.cvss.toFixed(1)} (4.0)` : a.cvss.toFixed(1);
}

/* ------------------------------------------------------------------ */
/* Generated-date line                                                  */
/* ------------------------------------------------------------------ */

export function AdvisoryGenerated() {
  const c = countBySeverity(ADVISORIES);
  const withCve = ADVISORIES.filter((a) => a.cve_id).length;
  const latest = ADVISORIES.reduce((m, a) => (a.published_at > m ? a.published_at : m), '');
  return (
    <p className={styles.generated}>
      <strong>{ADVISORIES.length}</strong> published advisories in{' '}
      <a href={`https://github.com/${DATA.repo}/security/advisories`}>{DATA.repo}</a>:{' '}
      {SEVERITIES.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && ', '}
          {c[s]} {s}
        </React.Fragment>
      ))}
      ; {withCve} with a CVE ID. Most recent published {day(latest)}. Data generated{' '}
      {day(DATA.generatedAt)} from the GitHub API and refreshed weekly.
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Minimum safe version                                                 */
/* ------------------------------------------------------------------ */

function highest(pairs: Array<[string, Advisory]>): [string, Advisory] | null {
  let best: [string, Advisory] | null = null;
  for (const p of pairs) if (!best || compareVersions(p[0], best[0]) > 0) best = p;
  return best;
}

export function MinimumSafeVersion({latest}: {latest: string}) {
  const {core, plugin} = useMemo(() => {
    const corePairs: Array<[string, Advisory]> = [];
    const pluginPairs: Array<[string, Advisory]> = [];
    for (const a of ADVISORIES) {
      for (const v of a.patched) corePairs.push([v, a]);
      for (const o of a.patched_other) {
        const m = /^(@openclaw\/\S+)\s+(\d{4}\.\d+\.\d+)$/.exec(o);
        if (m) pluginPairs.push([m[2], a]);
      }
    }
    return {core: highest(corePairs), plugin: highest(pluginPairs)};
  }, []);
  const latestClean = latest.replace(/^v/, '');
  const needed = [core?.[0], plugin?.[0]].filter(Boolean) as string[];
  const floor = needed.sort(compareVersions).at(-1);
  const covered = floor ? compareVersions(latestClean, floor) >= 0 : true;
  return (
    <div className={styles.callout} role="note">
      <p>
        Highest patched version in any published advisory:{' '}
        {core && (
          <>
            core <strong>{core[0]}</strong> (<a href={core[1].html_url}>{core[1].ghsa_id}</a>)
          </>
        )}
        {core && plugin && ', '}
        {plugin && (
          <>
            <code>@openclaw/*</code> plugins <strong>{plugin[0]}</strong> (
            <a href={plugin[1].html_url}>{plugin[1].ghsa_id}</a>)
          </>
        )}
        .
      </p>
      <p>
        {covered ? (
          <>
            The latest stable release, <strong>v{latestClean}</strong>, is at or above every
            published fix, so <strong>v{latestClean}</strong> (core and plugins) is the minimum
            safe version.
          </>
        ) : (
          <>
            The newest published fix (<strong>{floor}</strong>) is newer than v{latestClean}, the
            release this page was last checked against. Update to the latest stable release.
          </>
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stacked bar chart                                                    */
/* ------------------------------------------------------------------ */

interface MonthBucket {
  key: string; // YYYY-MM
  label: string; // "Feb"
  year: string;
  counts: Record<Severity, number>;
  total: number;
}

function buildMonths(list: Advisory[], until: string): MonthBucket[] {
  const keys = list.map((a) => a.published_at.slice(0, 7)).filter(Boolean).sort();
  if (!keys.length) return [];
  const [y0, m0] = keys[0].split('-').map(Number);
  const [y1, m1] = until.slice(0, 7).split('-').map(Number);
  const out: MonthBucket[] = [];
  for (let y = y0, m = m0; y < y1 || (y === y1 && m <= m1); m === 12 ? ((m = 1), y++) : m++) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    out.push({
      key,
      label: MONTHS[m - 1],
      year: String(y),
      counts: {critical: 0, high: 0, medium: 0, low: 0},
      total: 0,
    });
  }
  const idx = new Map(out.map((b, i) => [b.key, i]));
  for (const a of list) {
    const i = idx.get(a.published_at.slice(0, 7));
    if (i === undefined) continue;
    out[i].counts[a.severity] += 1;
    out[i].total += 1;
  }
  return out;
}

function niceMax(n: number): number {
  if (n <= 5) return 5;
  const pow = 10 ** Math.floor(Math.log10(n));
  for (const s of [1, 2, 2.5, 5, 10]) if (s * pow >= n) return s * pow;
  return 10 * pow;
}

export function AdvisoryChart() {
  const months = useMemo(() => buildMonths(ADVISORIES, DATA.generatedAt), []);
  const W = 600;
  const H = 290;
  const m = {top: 22, right: 6, bottom: 42, left: 38};
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;
  const max = niceMax(Math.max(1, ...months.map((b) => b.total)));
  const step = max / 5;
  const ticks = [0, 1, 2, 3, 4, 5].map((t) => Math.round(t * step));
  const band = iw / Math.max(1, months.length);
  const bw = Math.min(44, band * 0.62);
  const y = (v: number) => m.top + ih - (v / max) * ih;
  const first = months[0];
  const last = months[months.length - 1];
  const range = first && last ? `${first.label} ${first.year} to ${last.label} ${last.year}` : '';

  return (
    <figure className={styles.figure}>
      <ul className={styles.legend} aria-label="Severity colours">
        {SEVERITIES.map((s) => (
          <li key={s}>
            <span className={styles.swatch} data-sev={s} aria-hidden="true" />
            {SEV_LABEL[s]}
          </li>
        ))}
      </ul>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby="adv-chart-title adv-chart-desc">
        <title id="adv-chart-title">OpenClaw security advisories published per month, by severity</title>
        <desc id="adv-chart-desc">
          {`Stacked bars, ${range}. ` +
            months
              .map(
                (b) =>
                  `${b.label} ${b.year}: ${b.total} (` +
                  SEVERITIES.map((s) => `${b.counts[s]} ${s}`).join(', ') +
                  ')',
              )
              .join('; ') +
            '.'}
        </desc>
        <g aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className={styles.grid} x1={m.left} x2={W - m.right} y1={y(t)} y2={y(t)} />
              <text className={styles.tick} x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end">
                {t}
              </text>
            </g>
          ))}
        </g>
        {months.map((b, i) => {
          const cx = m.left + band * i + band / 2;
          let acc = 0;
          const showYear = i === 0 || b.label === 'Jan';
          return (
            <g key={b.key} className={styles.month}>
              <title>
                {`${b.label} ${b.year}: ${b.total} advisories\n` +
                  SEVERITIES.map((s) => `${SEV_LABEL[s]}: ${b.counts[s]}`).join('\n')}
              </title>
              <rect className={styles.hit} x={cx - band / 2} y={m.top} width={band} height={ih} />
              {SEVERITIES.map((s) => {
                const v = b.counts[s];
                if (!v) return null;
                const y0 = y(acc);
                acc += v;
                const y1 = y(acc);
                return (
                  <rect
                    key={s}
                    className={styles.seg}
                    data-sev={s}
                    x={cx - bw / 2}
                    y={y1}
                    width={bw}
                    height={Math.max(0, y0 - y1)}>
                    <title>{`${b.label} ${b.year}, ${SEV_LABEL[s]}: ${v}`}</title>
                  </rect>
                );
              })}
              <text className={styles.total} x={cx} y={y(b.total) - 5} textAnchor="middle">
                {b.total}
              </text>
              <text className={styles.tick} x={cx} y={m.top + ih + 16} textAnchor="middle">
                {b.label}
              </text>
              {showYear && (
                <text className={styles.tick} x={cx} y={m.top + ih + 33} textAnchor="middle">
                  {b.year}
                </text>
              )}
            </g>
          );
        })}
        <line className={styles.axis} x1={m.left} x2={W - m.right} y1={y(0)} y2={y(0)} />
      </svg>
      <figcaption className={styles.caption}>
        Advisories by publication month. Advisories are often published in batches after the fix
        ships, so a tall bar is a disclosure date, not the month the bugs were introduced. Hover a
        bar for its breakdown; the table below lists every advisory.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Filterable, sortable table                                           */
/* ------------------------------------------------------------------ */

type SortKey = 'published' | 'severity' | 'id';
const PAGE = 50;

export function AdvisoryTable({
  initialSeverity = 'all',
}: {
  initialSeverity?: Severity | 'all';
}) {
  const [sev, setSev] = useState<Severity | 'all'>(initialSeverity);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{key: SortKey; dir: 1 | -1}>({key: 'published', dir: -1});
  const [limit, setLimit] = useState(PAGE);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = ADVISORIES.filter(
      (a) =>
        (sev === 'all' || a.severity === sev) &&
        (!needle ||
          a.summary.toLowerCase().includes(needle) ||
          a.ghsa_id.toLowerCase().includes(needle) ||
          (a.cve_id ?? '').toLowerCase().includes(needle) ||
          fixedInText(a).toLowerCase().includes(needle)),
    );
    const cmp = (a: Advisory, b: Advisory): number => {
      switch (sort.key) {
        case 'severity':
          // Severity first, then CVSS score within a severity.
          return SEV_RANK[b.severity] - SEV_RANK[a.severity] || (a.cvss ?? -1) - (b.cvss ?? -1);
        case 'id':
          return a.ghsa_id.localeCompare(b.ghsa_id);
        default:
          return a.published_at.localeCompare(b.published_at);
      }
    };
    return [...list].sort(
      (a, b) => sort.dir * cmp(a, b) || b.published_at.localeCompare(a.published_at),
    );
  }, [sev, q, sort]);

  const counts = useMemo(() => countBySeverity(ADVISORIES), []);

  const header = (key: SortKey, label: string) => {
    const active = sort.key === key;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          className={styles.sortBtn}
          onClick={() =>
            setSort(active ? {key, dir: sort.dir === 1 ? -1 : 1} : {key, dir: key === 'id' ? 1 : -1})
          }>
          {label}
          <span aria-hidden="true">{active ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</span>
        </button>
      </th>
    );
  };

  const shown = rows.slice(0, limit);

  return (
    <div className={styles.tableWrap}>
      <div className={styles.controls}>
        <label>
          Severity{' '}
          <select
            value={sev}
            onChange={(e) => {
              setSev(e.target.value as Severity | 'all');
              setLimit(PAGE);
            }}>
            <option value="all">All ({ADVISORIES.length})</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {SEV_LABEL[s]} ({counts[s]})
              </option>
            ))}
          </select>
        </label>
        <label className={styles.search}>
          Search{' '}
          <input
            type="search"
            value={q}
            placeholder="summary, GHSA, CVE or version"
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
          />
        </label>
        <span className={styles.count} aria-live="polite">
          {rows.length} {rows.length === 1 ? 'advisory' : 'advisories'}
        </span>
      </div>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {header('published', 'Published')}
              {header('id', 'Advisory')}
              {header('severity', 'Severity')}
              <th scope="col">Summary</th>
              <th scope="col">Fixed in</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((a) => (
              <tr key={a.ghsa_id}>
                <td className={styles.nowrap}>{day(a.published_at)}</td>
                <td className={styles.nowrap}>
                  <a className={styles.ghsa} href={a.html_url}>{a.ghsa_id}</a>
                  {a.cve_id && <div className={styles.cve}>{a.cve_id}</div>}
                </td>
                <td>
                  <span className={styles.badge} data-sev={a.severity}>
                    {SEV_LABEL[a.severity]}
                  </span>
                  <div className={styles.cvss}>
                    <abbr title="CVSS score">{cvssText(a)}</abbr>
                  </div>
                </td>
                <td>{a.summary}</td>
                <td>{fixedInText(a)}</td>
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={5}>No advisories match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > limit && (
        <button
          type="button"
          className="button button--secondary button--sm"
          onClick={() => setLimit(limit + PAGE * 4)}>
          Show more ({rows.length - limit} remaining)
        </button>
      )}
      <p className={styles.note}>
        Under each severity is the CVSS score, 3.1 unless marked (4.0); sorting by severity orders by score within a severity. Severity is GitHub's label; advisories without a numeric
        score are listed as "not scored". "Fixed in" is the first patched <code>openclaw</code>{' '}
        version (or the older <code>clawdbot</code> package), then any plugin or app fixes.
      </p>
    </div>
  );
}

export default function AdvisoryTimeline() {
  return (
    <>
      <AdvisoryGenerated />
      <AdvisoryChart />
      <AdvisoryTable />
    </>
  );
}
