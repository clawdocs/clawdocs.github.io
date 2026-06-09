---
sidebar_position: 8
title: Deployment Options
description: Compare ways to deploy OpenClaw — bare metal, Docker, Kubernetes, Cloudflare Workers, 1Panel, Coolify, and more
keywords: [openclaw, deploy, docker, kubernetes, cloud hosting, self-host]
---

# Deployment Options

OpenClaw can be deployed in many ways, from a simple local install to fully managed cloud hosting. This guide compares the major options.

## Quick Comparison

| Method | Difficulty | Best For | Cost |
|--------|-----------|----------|------|
| [Local install](/getting-started/installation) | Easy | Personal use, development | Free (+ LLM API) |
| [Docker](#docker) | Medium | Self-hosters, VPS | Free (+ VPS + LLM API) |
| [Moltworker](#moltworker) | Easy | Cloudflare users | ~$34.50/mo |
| [Kubernetes](#kubernetes) | Hard | Production, teams | Free (+ cluster + LLM API) |
| [1Panel](#1panel) | Easy | VPS with GUI management | Free (+ VPS + LLM API) |
| [Coolify](#coolify) | Easy | Self-hosted PaaS users | Free (+ VPS + LLM API) |
| [DigitalOcean 1-Click](#digitalocean) | Easy | Quick cloud deploy | From $24/mo |
| [Hostinger Template](#hostinger) | Easy | Budget VPS | From $5/mo + LLM API |
| [Managed Hosting](#managed-hosting) | Easiest | Non-technical users | Varies |

## Docker {#docker}

The official Docker image is the most popular self-hosted deployment method.

```bash
# Pull the latest image
docker pull openclaw/openclaw:latest

# Run with Docker Compose (recommended)
curl -fsSL https://docs.openclaw.ai/docker-compose.yml -o docker-compose.yml
docker compose up -d
```

The Docker setup:
1. Builds the OpenClaw image locally
2. Runs the onboarding wizard inside the container
3. Generates a gateway token for accessing the Control UI
4. Creates necessary configuration volumes
5. Starts the Gateway via Docker Compose

```yaml title="docker-compose.yml (example)"
services:
  openclaw:
    image: openclaw/openclaw:latest
    ports:
      - "18789:18789"
    volumes:
      - openclaw-data:/root/.openclaw
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped

volumes:
  openclaw-data:
```

:::danger
**Never bind port 18789 to `0.0.0.0` without authentication.** Use `127.0.0.1:18789:18789` or put OpenClaw behind a reverse proxy with auth.
:::

### Docker with Local Models

To run OpenClaw with Ollama for fully local inference:

```yaml title="docker-compose.yml"
services:
  openclaw:
    image: openclaw/openclaw:latest
    ports:
      - "127.0.0.1:18789:18789"
    volumes:
      - openclaw-data:/root/.openclaw
    environment:
      - OPENCLAW_BRAIN_PROVIDER=ollama
      - OLLAMA_HOST=http://ollama:11434
    depends_on:
      - ollama
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama-data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped

volumes:
  openclaw-data:
  ollama-data:
```

## Moltworker (Cloudflare Workers) {#moltworker}

[Moltworker](https://github.com/cloudflare/moltworker) is **Cloudflare's official** adaptation that runs OpenClaw on Workers and Sandbox containers — fully managed, always-on, no self-hosting required.

- **8,400 GitHub stars** | **License**: Apache-2.0
- Multi-channel chat (Telegram, Discord, Slack)
- Device pairing authentication
- Optional R2 persistent storage
- Browser automation via CDP
- Cloudflare AI Gateway routing
- **Cost**: ~$34.50/month on standard-1 instance

### Getting Started with Moltworker

1. Fork the [Moltworker repo](https://github.com/cloudflare/moltworker)
2. Configure your Cloudflare account and Workers environment
3. Set environment variables (LLM API keys, channel tokens)
4. Deploy via `wrangler deploy`

:::tip
Moltworker is ideal if you're already on the Cloudflare ecosystem. It handles scaling, uptime, and edge deployment automatically.
:::

## Kubernetes (Helm Chart) {#kubernetes}

For production deployments on Kubernetes, use the community [Helm chart](https://github.com/serhanekicii/openclaw-helm):

```bash
helm repo add openclaw https://serhanekicii.github.io/openclaw-helm
helm install openclaw openclaw/openclaw -f values.yaml
```

### Key Features

- **StatefulSet** deployment with Chromium sidecar for browser automation
- **Security-hardened**: non-root containers, read-only root filesystems, all capabilities dropped
- **Dual config modes**: "merge" (preserves runtime changes) or "overwrite" (strict GitOps)
- **Init containers** for auto-installing ClawHub skills
- **Health probes** on both OpenClaw and Chromium containers
- **ArgoCD** and **Stakater Reloader** compatible
- **Network policies** with deny-all-ingress defaults
- Requires K8s 1.26+

```yaml title="values.yaml (example)"
openclaw:
  config:
    gateway:
      port: 18789
      host: "0.0.0.0"
    brain:
      provider: anthropic
  env:
    ANTHROPIC_API_KEY:
      secretKeyRef:
        name: openclaw-secrets
        key: anthropic-api-key
```

## 1Panel {#1panel}

[1Panel](https://github.com/1Panel-dev/1Panel) is an open-source web-based Linux server management panel with an **App Store** that includes OpenClaw as a one-click install.

### Why 1Panel?

- **GUI-based management** — No command line required after initial setup
- **One-click OpenClaw install** from the App Store
- **Ollama integration** — Install local LLMs alongside OpenClaw
- **Built-in monitoring** — CPU, memory, disk, network dashboards
- **Docker management** — Visual container management
- **Backup/restore** — One-click backup to cloud storage
- **Firewall management** — Security hardening through the UI
- **33,300+ GitHub stars** — Large, active community

### Installing 1Panel

```bash
# One-line install on any Linux server
bash -c "$(curl -sSL https://resource.fit2cloud.com/1panel/package/v2/quick_start.sh)"
```

After installation, access the web panel at `http://your-server:port` (the installer will show you the URL and credentials).

### Installing OpenClaw via 1Panel

1. Open the 1Panel web interface
2. Navigate to **App Store**
3. Search for **OpenClaw**
4. Click **Install**
5. Configure your LLM API key and other settings
6. Click **Confirm**

1Panel uses the `1panel/openclaw` Docker image and handles all the container management, volume mounts, and networking for you.

### Managing OpenClaw in 1Panel

Once installed, you can:
- **Start/stop/restart** the OpenClaw container
- **View logs** in real-time
- **Update** to new versions with one click
- **Configure** environment variables
- **Monitor** resource usage (CPU, memory)
- **Backup** configuration and memory data

### 1Panel Specs

| Detail | Value |
|--------|-------|
| Repository | [github.com/1Panel-dev/1Panel](https://github.com/1Panel-dev/1Panel) |
| License | GPLv3 (Pro tier available) |
| Stack | Go backend, Vue.js frontend |
| Stars | 33,300+ |
| OpenClaw image | `1panel/openclaw` on Docker Hub |

## Coolify {#coolify}

[Coolify](https://coolify.io) is a self-hosted PaaS (like Heroku) that supports OpenClaw deployment. The most popular community integration is [openclaw-coolify](https://github.com/essamamdani/openclaw-coolify) (96 stars).

Features of the Coolify integration:
- **Docker Sidecar Proxy** for sandboxing
- **Cloudflare Tunnel** integration for secure access
- **SearXNG** private search engine
- Pre-installed dev tools (GitHub CLI, Vercel, Bun, Python, ripgrep)
- Bitwarden/GPG encryption support

```bash
# Deploy via Coolify's one-click service
# (from the Coolify dashboard, select OpenClaw from the service catalog)
```

See the [official Coolify docs](https://coolify.io/docs/services/openclaw) or the [community integration repo](https://github.com/essamamdani/openclaw-coolify) for details.

:::info
The Coolify build requires ~13 GB free disk space for the Docker build cache.
:::

## DigitalOcean 1-Click {#digitalocean}

DigitalOcean offers a pre-configured Droplet image with OpenClaw:

- Security-hardened configuration out of the box
- Starts at **$24/month** (4GB RAM Droplet)
- Automatic updates available
- Production-ready Gateway configuration

Deploy from the [DigitalOcean Marketplace](https://marketplace.digitalocean.com/apps/openclaw).

## Hostinger {#hostinger}

Hostinger provides a one-click OpenClaw Docker template for their VPS plans:

- Budget-friendly starting at **~$5/month**
- Docker template pre-configured
- Step-by-step setup guide provided

## Managed Hosting {#managed-hosting}

35+ managed hosting providers have emerged for OpenClaw, ranging from $0.99/month shared containers to enterprise GDPR-compliant deployments. See the **[Hosting Providers guide](/guides/hosting-providers)** for a comprehensive comparison.

Highlights:
- **Cheapest**: [Agent37](https://www.agent37.com/openclaw) at $0.99/mo (shared)
- **Free**: [Oracle Cloud free tier](https://docs.openclaw.ai/platforms/oracle) — 4 ARM CPUs, 24 GB RAM
- **Budget managed**: [MyClaw.ai](https://myclaw.ai) from $9/mo
- **GDPR**: [WZ-IT](https://wz-it.com/en/expertises/openclaw/) (German enterprise), [RunClaw.ai](https://runclaw.ai) (Hetzner DE)
- **Pay-as-you-go**: [Clowd.bot](https://clowd.bot) at $0.50 per launch

:::warning
With managed hosting, your conversations and data pass through a third party's infrastructure. Review the provider's privacy policy carefully. Self-hosting gives you full control over your data.
:::

## Choosing the Right Option

```mermaid
flowchart TD
    Start["How do you want<br/>to run OpenClaw?"] --> Tech{Comfortable with<br/>command line?}
    Tech -- Yes --> Cloud{Own server<br/>or cloud?}
    Tech -- No --> GUI{Want to manage<br/>the server?}

    Cloud -- Local --> Local["📦 Local Install"]
    Cloud -- VPS --> Docker["🐳 Docker Compose"]

    GUI -- Yes --> Panel["🖥️ 1Panel"]
    GUI -- No --> Managed["☁️ Managed Hosting"]

    Docker --> Ollama{Need local<br/>LLMs?}
    Ollama -- Yes --> DockerOllama["🐳 Docker + Ollama"]
    Ollama -- No --> DockerAPI["🐳 Docker + API Key"]
```

### Minimum Server Requirements

| Setup | RAM | CPU | Storage | GPU |
|-------|-----|-----|---------|-----|
| API-only (Anthropic/OpenAI) | 1 GB | 1 vCPU | 5 GB | None |
| With Ollama (small models) | 8 GB | 4 vCPU | 20 GB | Optional |
| With Ollama (large models) | 32 GB | 8 vCPU | 50 GB | Recommended |

## See Also

- [Installation](/getting-started/installation) — Local installation guide
- [Local Models](/guides/local-models) — Running with Ollama or vLLM
- [Security Hardening](/security/hardening) — Securing any deployment
- [WebClaw](/guides/webclaw) — Browser-based client for remote access
- [Ecosystem](/reference/ecosystem) — All community tools and projects
