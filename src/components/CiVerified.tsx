import React from 'react';
import styles from './CiVerified.module.css';

// Front matter written by a human after a green run of the "Tutorial tests"
// workflow (.github/workflows/tutorials.yml). See scripts/README.md.
export type CiVerifiedData = {
  version: string;
  date: string;
  steps?: number;
};

const WORKFLOW_URL =
  'https://github.com/clawdocs/clawdocs.github.io/actions/workflows/tutorials.yml';

function isCiVerified(v: unknown): v is CiVerifiedData {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (typeof o.version === 'string' || typeof o.version === 'number') &&
    (typeof o.date === 'string' || o.date instanceof Date);
}

export default function CiVerified({data}: {data: unknown}): React.ReactElement | null {
  if (!isCiVerified(data)) return null;
  // YAML may parse an unquoted date as a Date object.
  const raw = data.date as unknown;
  const date = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw);
  const steps = typeof data.steps === 'number' ? data.steps : undefined;
  return (
    <div className={styles.banner}>
      <span className={styles.mark} aria-hidden="true">✓</span>{' '}
      <a href={WORKFLOW_URL} title="Commands on this page are run against a real Gateway in GitHub Actions">
        Verified in CI
      </a>{' '}
      on OpenClaw {String(data.version)}, {date}
      {steps !== undefined && <> — {steps} steps run</>}
    </div>
  );
}
