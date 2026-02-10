import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/getting-started/introduction">
            Get Started
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/getting-started/quick-start">
            Quick Start (5 min)
          </Link>
        </div>
      </div>
    </header>
  );
}

type FeatureItem = {
  title: string;
  icon: string;
  description: string;
  link: string;
};

const features: FeatureItem[] = [
  {
    title: 'Autonomous Agent',
    icon: '🤖',
    description:
      'OpenClaw runs 24/7 on your machine with a heartbeat system that proactively monitors tasks, processes inboxes, and takes action without prompting.',
    link: '/architecture/heartbeat',
  },
  {
    title: '50+ Integrations',
    icon: '🔗',
    description:
      'Connect to WhatsApp, Telegram, Discord, Slack, Gmail, GitHub, Spotify, smart home devices, and dozens more platforms out of the box.',
    link: '/guides/channels',
  },
  {
    title: 'Any LLM Provider',
    icon: '🧠',
    description:
      'Works with Claude, GPT, Grok, or fully local models via Ollama and vLLM. Your choice of brain, your control over costs.',
    link: '/guides/local-models',
  },
  {
    title: 'Extensible Skills',
    icon: '⚡',
    description:
      'Build custom skills with simple Markdown + YAML. Share them on ClawHub or install from a community of 100+ preconfigured agent skills.',
    link: '/guides/skill-development',
  },
  {
    title: 'Private by Default',
    icon: '🔒',
    description:
      'All data stays on your machine. Persistent memory is stored as local Markdown. No cloud accounts required — run fully offline with local models.',
    link: '/architecture/memory-system',
  },
  {
    title: 'Security-First',
    icon: '🛡️',
    description:
      'VirusTotal-scanned ClawHub skills, built-in code safety scanner, optional sandboxing, and comprehensive hardening guides for production use.',
    link: '/security/overview',
  },
];

function Feature({title, icon, description, link}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="feature-card margin-bottom--lg">
        <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>{icon}</div>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        <Link to={link}>Learn more →</Link>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section className="padding-vert--xl">
      <div className="container">
        <div className="text--center margin-bottom--xl">
          <Heading as="h2">Why OpenClaw?</Heading>
          <p className="hero__subtitle">
            The open-source AI agent with 182k+ GitHub stars
          </p>
        </div>
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  return (
    <section className="padding-vert--xl" style={{background: 'var(--ifm-color-emphasis-100)'}}>
      <div className="container">
        <div className="row">
          <div className="col col--4 text--center">
            <Heading as="h3">📦 Install</Heading>
            <code>curl -fsSL https://openclaw.ai/install.sh | bash</code>
            <br />
            <Link to="/getting-started/installation" className="margin-top--sm">
              Installation guide →
            </Link>
          </div>
          <div className="col col--4 text--center">
            <Heading as="h3">🏗️ Architecture</Heading>
            <p>Gateway, Brain, Hands, Memory, and the Heartbeat loop</p>
            <Link to="/architecture/overview">Deep dive →</Link>
          </div>
          <div className="col col--4 text--center">
            <Heading as="h3">🔐 Secure It</Heading>
            <p>Harden your deployment before going to production</p>
            <Link to="/security/hardening">Security guide →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <QuickLinks />
      </main>
    </Layout>
  );
}
