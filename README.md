# OpenClaw Docs

Community documentation for [OpenClaw](https://openclaw.ai), published at [clawdocs.org](https://clawdocs.org). Built with [Docusaurus](https://docusaurus.io/).

## Installation

```bash
npm install
```

## Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Deployment is automated: pushes to the `gh-pages` branch trigger the [deploy workflow](.github/workflows/deploy.yml), which builds the site and publishes it to GitHub Pages. No manual deploy step is needed — get a pull request merged and the site updates automatically.
