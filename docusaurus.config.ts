import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'OpenClaw Docs — Community Documentation for the Open-Source AI Agent',
  tagline: 'The community-driven documentation for OpenClaw — your autonomous AI agent',
  favicon: 'img/favicon.ico',

  url: 'https://clawdocs.org',
  baseUrl: '/',
  organizationName: 'clawdocs',
  projectName: 'clawdocs.github.io',
  trailingSlash: false,

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

  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'robots',
        content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      },
    },
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'OpenClaw Docs',
        url: 'https://clawdocs.org',
        description: 'Community documentation for OpenClaw, the open-source autonomous AI agent with 377,000+ GitHub stars.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://clawdocs.org/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }),
    },
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ClawDocs',
        url: 'https://clawdocs.org',
        logo: 'https://clawdocs.org/img/logo.svg',
        sameAs: [
          'https://github.com/clawdocs/clawdocs.github.io',
          'https://discord.gg/openclaw',
        ],
      }),
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/clawdocs/clawdocs.github.io/tree/gh-pages/',
          routeBasePath: '/',
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',

    metadata: [
      {name: 'keywords', content: 'openclaw, ai agent, autonomous agent, open source ai, clawdbot, moltbot, self-hosted ai, ai automation, openclaw documentation, openclaw guide, openclaw tutorial, openclaw setup, openclaw installation'},
      {name: 'description', content: 'Comprehensive documentation for OpenClaw, the open-source autonomous AI agent with 377k+ stars. Installation, guides, architecture, security, and 70+ pages of production recipes.'},
      {property: 'og:type', content: 'website'},
      {property: 'og:site_name', content: 'OpenClaw Docs'},
      {property: 'og:image:width', content: '1200'},
      {property: 'og:image:height', content: '630'},
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:site', content: '@openclaw'},
      {name: 'twitter:image', content: 'https://clawdocs.org/img/social-card.png'},
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
          title: 'Get Started',
          items: [
            {label: 'Introduction', to: '/getting-started/introduction'},
            {label: 'Installation', to: '/getting-started/installation'},
            {label: 'Quick Start', to: '/getting-started/quick-start'},
            {label: 'First 7 Days', to: '/guides/first-7-days'},
            {label: 'Model Selection', to: '/guides/model-selection'},
          ],
        },
        {
          title: 'Guides',
          items: [
            {label: 'MCP Servers', to: '/guides/mcp-servers'},
            {label: 'Custom Channels', to: '/guides/custom-channels'},
            {label: 'Lobster Workflows', to: '/guides/lobster-workflows'},
            {label: 'Plugin System', to: '/guides/plugin-system'},
            {label: 'Advanced Recipes', to: '/guides/recipes/advanced-recipes'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'OpenClaw GitHub', href: 'https://github.com/openclaw/openclaw'},
            {label: 'Discord', href: 'https://discord.gg/openclaw'},
            {label: 'Reddit r/OpenClaw', href: 'https://reddit.com/r/OpenClaw'},
            {label: 'ClawHub', href: 'https://openclaw.ai/clawhub'},
            {label: 'Contribute to Docs', href: 'https://github.com/clawdocs/clawdocs.github.io'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'Architecture', to: '/architecture/overview'},
            {label: 'Security', to: '/security/overview'},
            {label: 'FAQ', to: '/reference/faq'},
            {label: 'Changelog', href: 'https://github.com/openclaw/openclaw/releases'},
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
