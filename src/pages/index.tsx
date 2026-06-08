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
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroGlow} />
        <div className="container">
          <div className={styles.heroBadge}>
            <span className={styles.badgeDot} />
            Open Source &middot; 377k+ GitHub Stars
          </div>
          <Heading as="h1" className={styles.heroTitle}>
            The Community Docs for{' '}
            <span className={styles.heroHighlight}>OpenClaw</span>
          </Heading>
          <p className={styles.heroSubtitle}>
            Guides, architecture deep-dives, and production recipes for the
            world's most popular open-source AI agent
          </p>
          <div className={styles.heroButtons}>
            <Link
              className={clsx('button button--lg', styles.btnPrimary)}
              to="/getting-started/introduction">
              Get Started
            </Link>
            <Link
              className={clsx('button button--lg', styles.btnOutline)}
              to="/getting-started/quick-start">
              Quick Start &mdash; 5 min
            </Link>
            <Link
              className={clsx('button button--lg', styles.btnGhost)}
              to="/guides/first-7-days">
              First 7 Days Guide
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatsBar() {
  const stats = [
    {value: '40+', label: 'Guides'},
    {value: '50+', label: 'Channels'},
    {value: '32k+', label: 'MCP Servers'},
    {value: '10,700+', label: 'Skills on ClawHub'},
  ];
  return (
    <section className={styles.statsBar}>
      <div className="container">
        <div className={styles.statsGrid}>
          {stats.map((s, i) => (
            <div key={i} className={styles.statItem}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
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
      'Runs 24/7 with a heartbeat system that monitors tasks, processes inboxes, and acts without prompting.',
    link: '/architecture/heartbeat',
  },
  {
    title: '50+ Integrations',
    icon: '🔗',
    description:
      'WhatsApp, Telegram, Discord, Slack, Gmail, GitHub, smart home — dozens of platforms out of the box.',
    link: '/guides/channels',
  },
  {
    title: 'Any LLM Provider',
    icon: '🧠',
    description:
      'Claude, GPT, Grok, DeepSeek, or fully local models via Ollama and vLLM. Your brain, your cost.',
    link: '/guides/model-selection',
  },
  {
    title: 'MCP Ecosystem',
    icon: '🔌',
    description:
      '32,600+ MCP servers with 229,800+ tools. Connect databases, APIs, and services with one protocol.',
    link: '/guides/mcp-servers',
  },
  {
    title: 'Extensible Skills',
    icon: '⚡',
    description:
      'Build skills with Markdown + YAML. Browse 10,700+ community skills on ClawHub with security scanning.',
    link: '/guides/clawhub',
  },
  {
    title: 'Private & Secure',
    icon: '🛡️',
    description:
      'Data stays on your machine. Local memory, optional sandboxing, VirusTotal-scanned skills, hardening guides.',
    link: '/security/overview',
  },
];

function Feature({title, icon, description, link}: FeatureItem) {
  return (
    <div className="col col--4">
      <Link to={link} className={styles.featureLink}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>{icon}</div>
          <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
          <p className={styles.featureDesc}>{description}</p>
          <span className={styles.featureArrow}>Learn more →</span>
        </div>
      </Link>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="text--center margin-bottom--xl">
          <Heading as="h2" className={styles.sectionTitle}>Why OpenClaw?</Heading>
          <p className={styles.sectionSubtitle}>
            The open-source AI agent with the largest community
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

type GuideCard = {
  title: string;
  description: string;
  link: string;
  tag: string;
  tagColor: string;
};

const newGuides: GuideCard[] = [
  {
    title: 'First 7 Days with OpenClaw',
    description: 'From zero to power user in one week — daily guide with hands-on projects',
    link: '/guides/first-7-days',
    tag: 'Series',
    tagColor: '#dc2626',
  },
  {
    title: 'API & Webhooks',
    description: 'WebSocket API, webhook ingress/egress, Node.js & Python clients, integration patterns',
    link: '/guides/api-webhooks',
    tag: 'New',
    tagColor: '#16a34a',
  },
  {
    title: 'Voice & Multimodal',
    description: 'Voice control, vision, image generation, real-time audio, and wearable integration',
    link: '/guides/voice-multimodal',
    tag: 'New',
    tagColor: '#16a34a',
  },
  {
    title: 'Performance Tuning',
    description: 'Cut costs 97% — model routing, heartbeat optimization, caching, and token reduction',
    link: '/guides/performance-tuning',
    tag: 'New',
    tagColor: '#16a34a',
  },
  {
    title: 'Monitoring & Observability',
    description: 'OpenTelemetry, dashboards, alerting, health checks, and cost tracking',
    link: '/guides/monitoring',
    tag: 'New',
    tagColor: '#16a34a',
  },
  {
    title: 'CI/CD & Testing',
    description: 'Test skills, GitHub Actions workflows, Docker deploy, Kubernetes Helm, and rollback',
    link: '/guides/cicd-testing',
    tag: 'New',
    tagColor: '#16a34a',
  },
  {
    title: 'MCP Servers',
    description: 'Find, connect, and build MCP servers — the protocol powering 32k+ integrations',
    link: '/guides/mcp-servers',
    tag: 'Popular',
    tagColor: '#7c3aed',
  },
  {
    title: 'Custom Channels',
    description: 'Build channel adapters for any messaging platform with the TypeScript SDK',
    link: '/guides/custom-channels',
    tag: 'Guide',
    tagColor: '#2563eb',
  },
  {
    title: 'Troubleshooting',
    description: 'Diagnostic commands, debug mode, fix recipes for every subsystem, emergency reset',
    link: '/reference/troubleshooting',
    tag: 'Reference',
    tagColor: '#d97706',
  },
  {
    title: 'ClawHub Marketplace',
    description: '10,700+ skills — browse, install, verify, publish, and secure your skill supply chain',
    link: '/guides/clawhub',
    tag: 'Updated',
    tagColor: '#16a34a',
  },
  {
    title: 'Multi-Agent Workflows',
    description: 'Orchestrator-worker fleets, Workboard kanban, shared memory, and cost optimization',
    link: '/guides/multi-agent',
    tag: 'Updated',
    tagColor: '#16a34a',
  },
  {
    title: 'Security Hardening',
    description: 'MCP trust tiers, SOUL.md protection, incident response runbook, and audit recipes',
    link: '/security/hardening',
    tag: 'Updated',
    tagColor: '#16a34a',
  },
];

function GuideShowcase() {
  return (
    <section className={styles.showcase}>
      <div className="container">
        <div className="text--center margin-bottom--xl">
          <Heading as="h2" className={styles.sectionTitle}>Explore the Guides</Heading>
          <p className={styles.sectionSubtitle}>
            In-depth guides for every stage — from first install to production deployment
          </p>
        </div>
        <div className={styles.guideGrid}>
          {newGuides.map((g, i) => (
            <Link key={i} to={g.link} className={styles.guideLink}>
              <div className={styles.guideCard}>
                <div className={styles.guideHeader}>
                  <span className={styles.guideTag} style={{background: g.tagColor}}>
                    {g.tag}
                  </span>
                </div>
                <Heading as="h3" className={styles.guideTitle}>{g.title}</Heading>
                <p className={styles.guideDesc}>{g.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStart() {
  return (
    <section className={styles.quickStart}>
      <div className="container">
        <div className="row">
          <div className="col col--6">
            <Heading as="h2" className={styles.sectionTitle}>Up and Running in Minutes</Heading>
            <p className={styles.quickStartText}>
              Install OpenClaw, connect a channel, and start chatting with your AI agent.
              The Quick Start guide gets you from zero to a working agent in under 5 minutes.
            </p>
            <div className={styles.quickStartButtons}>
              <Link
                className={clsx('button button--lg', styles.btnPrimary)}
                to="/getting-started/installation">
                Installation Guide
              </Link>
              <Link
                className={clsx('button button--lg', styles.btnOutline)}
                to="/guides/model-selection">
                Choose a Model
              </Link>
            </div>
          </div>
          <div className="col col--6">
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span className={styles.codeDot} style={{background: '#ef4444'}} />
                <span className={styles.codeDot} style={{background: '#f59e0b'}} />
                <span className={styles.codeDot} style={{background: '#22c55e'}} />
                <span className={styles.codeTitle}>Terminal</span>
              </div>
              <pre className={styles.codePre}>
                <code>
{`# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Configure your LLM provider
openclaw config set provider openrouter
openclaw config set model deepseek/deepseek-chat-v3-0324

# Connect Telegram
openclaw channel add telegram

# Launch
openclaw start`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExploreMore() {
  const sections = [
    {
      icon: '🏗️',
      title: 'Architecture',
      desc: 'Gateway, Brain, Hands, Memory, and the Heartbeat loop',
      link: '/architecture/overview',
    },
    {
      icon: '🔐',
      title: 'Security',
      desc: 'Threat model, hardening, skill verification, and known vulnerabilities',
      link: '/security/overview',
    },
    {
      icon: '📖',
      title: 'Reference',
      desc: 'CLI reference, configuration, Gateway API, environment variables',
      link: '/reference/cli',
    },
    {
      icon: '🤝',
      title: 'Contributing',
      desc: 'Help improve these docs or contribute to OpenClaw itself',
      link: '/contributing/docs',
    },
  ];
  return (
    <section className={styles.exploreMore}>
      <div className="container">
        <div className="text--center margin-bottom--lg">
          <Heading as="h2" className={styles.sectionTitle}>Go Deeper</Heading>
        </div>
        <div className={styles.exploreGrid}>
          {sections.map((s, i) => (
            <Link key={i} to={s.link} className={styles.exploreLink}>
              <div className={styles.exploreCard}>
                <span className={styles.exploreIcon}>{s.icon}</span>
                <div>
                  <Heading as="h3" className={styles.exploreTitle}>{s.title}</Heading>
                  <p className={styles.exploreDesc}>{s.desc}</p>
                </div>
              </div>
            </Link>
          ))}
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
        <StatsBar />
        <HomepageFeatures />
        <GuideShowcase />
        <QuickStart />
        <ExploreMore />
      </main>
    </Layout>
  );
}
