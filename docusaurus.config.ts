import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'OpenClaw Docs',
  tagline: 'The community-driven documentation for OpenClaw — your autonomous AI agent',
  favicon: 'img/favicon.ico',

  url: 'https://clawdocs.org',
  baseUrl: '/',
  organizationName: 'clawdocs',
  projectName: 'clawdocs.github.io',

  onBrokenLinks: 'warn',

  future: {
    v4: true,
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/clawdocs/clawdocs.github.io/tree/gh-pages/',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',

    metadata: [
      {name: 'keywords', content: 'openclaw, ai agent, autonomous agent, clawdbot, moltbot, documentation, self-hosted ai'},
      {name: 'description', content: 'Comprehensive documentation for OpenClaw, the open-source autonomous AI agent. Installation guides, architecture deep-dives, security hardening, skill development, and more.'},
      {property: 'og:type', content: 'website'},
    ],

    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    announcementBar: {
      id: 'security_notice_2026',
      content: '🔒 <strong>Security Notice:</strong> Always run the latest version. <a href="/security/overview">Read the security guide</a> before deploying.',
      backgroundColor: '#dc2626',
      textColor: '#fff',
      isCloseable: true,
    },

    navbar: {
      title: 'OpenClaw Docs',
      logo: {
        alt: 'OpenClaw Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/getting-started/introduction',
          label: 'Getting Started',
          position: 'left',
        },
        {
          to: '/architecture/overview',
          label: 'Architecture',
          position: 'left',
        },
        {
          to: '/guides/basic-usage',
          label: 'Guides',
          position: 'left',
        },
        {
          type: 'dropdown',
          label: 'Reference',
          position: 'left',
          items: [
            {label: 'CLI Reference', to: '/reference/cli'},
            {label: 'Configuration', to: '/reference/configuration'},
            {label: 'Gateway API', to: '/reference/gateway-api'},
            {type: 'html', value: '<hr style="margin: 0.5rem 0;">'},
            {label: 'Troubleshooting', to: '/reference/troubleshooting'},
            {label: 'FAQ', to: '/reference/faq'},
          ],
        },
        {
          to: '/security/overview',
          label: 'Security',
          position: 'left',
        },
        {
          type: 'dropdown',
          label: 'Ecosystem',
          position: 'right',
          items: [
            {label: 'Ecosystem Overview', to: '/reference/ecosystem'},
            {label: 'Deployment Options', to: '/guides/deployment-options'},
            {label: 'Hosting Providers', to: '/guides/hosting-providers'},
            {label: 'WebClaw Client', to: '/guides/webclaw'},
            {type: 'html', value: '<hr style="margin: 0.5rem 0;">'},
            {label: 'OpenClaw GitHub', href: 'https://github.com/openclaw/openclaw'},
            {label: 'ClawHub Skills', href: 'https://openclaw.ai/clawhub'},
            {type: 'html', value: '<hr style="margin: 0.5rem 0;">'},
            {label: 'openclaw.ai', href: 'https://openclaw.ai'},
            {label: 'Discord', href: 'https://discord.gg/openclaw'},
          ],
        },
        {
          href: 'https://github.com/clawdocs/clawdocs.github.io',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {label: 'Introduction', to: '/getting-started/introduction'},
            {label: 'Installation', to: '/getting-started/installation'},
            {label: 'Quick Start', to: '/getting-started/quick-start'},
            {label: 'Architecture', to: '/architecture/overview'},
          ],
        },
        {
          title: 'Guides',
          items: [
            {label: 'Channels & Integrations', to: '/guides/channels'},
            {label: 'Skill Development', to: '/guides/skill-development'},
            {label: 'Heartbeat System', to: '/guides/heartbeat'},
            {label: 'Security Hardening', to: '/security/hardening'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'GitHub', href: 'https://github.com/openclaw/openclaw'},
            {label: 'Discord', href: 'https://discord.gg/openclaw'},
            {label: 'ClawHub', href: 'https://openclaw.ai/clawhub'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'Changelog', href: 'https://github.com/openclaw/openclaw/releases'},
            {label: 'Contribute to these docs', href: 'https://github.com/clawdocs/clawdocs.github.io'},
            {label: 'Official Site', href: 'https://openclaw.ai'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ClawDocs Contributors. Not affiliated with OpenClaw. Built with Docusaurus.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'yaml', 'toml', 'python', 'docker'],
    },

    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
