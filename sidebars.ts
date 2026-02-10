import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/introduction',
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/core-concepts',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
        'architecture/gateway',
        'architecture/brain-and-hands',
        'architecture/memory-system',
        'architecture/heartbeat',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: true,
      items: [
        'guides/basic-usage',
        'guides/channels',
        'guides/skill-development',
        'guides/heartbeat',
        'guides/local-models',
        'guides/clawhub',
        {
          type: 'category',
          label: 'Recipes',
          collapsed: true,
          items: [
            'guides/recipes/email-assistant',
            'guides/recipes/code-reviewer',
            'guides/recipes/smart-home',
            'guides/recipes/research-agent',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Security',
      collapsed: true,
      items: [
        'security/overview',
        'security/hardening',
        'security/known-vulnerabilities',
        'security/skill-verification',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: true,
      items: [
        'reference/cli',
        'reference/configuration',
        'reference/gateway-api',
        'reference/environment-variables',
        'reference/troubleshooting',
        'reference/faq',
      ],
    },
    {
      type: 'category',
      label: 'Contributing',
      collapsed: true,
      items: [
        'contributing/docs',
        'contributing/openclaw',
      ],
    },
  ],
};

export default sidebars;
