---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Hosting Providers
description: Compare about 25 OpenClaw hosting providers, from free VPS tiers to managed and enterprise hosting. Prices checked 2026-10-18.
keywords: [openclaw, hosting, managed hosting, cloud providers, vps]
---

# Hosting Providers

About 25 providers offer OpenClaw hosting: fully managed services, platforms that manage your own server, VPS templates, and enterprise tiers. This page lists them with prices checked on **2026-10-18** against each provider's own site. Prices change often; check the provider before you buy.

:::note Listings are vendor-submitted
Most entries were added by the providers themselves or copied from their marketing pages. Clawdocs has not tested these services and does not endorse any of them. See the [listing policy](#listing-policy).
:::

:::tip
Not sure whether to self-host or use managed hosting? See [Deployment Options](/guides/deployment-options) for a comparison of all deployment methods including Docker, Kubernetes, and Cloudflare Workers.
:::

## Quick Comparison {#pricing-at-a-glance}

Prices are entry prices as of 2026-10-18, from each provider's site. Promotional prices are marked.

| Provider | Type | From | Local LLMs | GDPR | Best For |
|----------|------|------|-----------|------|----------|
| [Oracle Cloud](#oracle-cloud) | Free VPS | **$0/mo** | Yes | No | Free hosting with Ollama |
| [Aplite](#aplite) | Managed | Free / $20/mo | No | Yes (EU) | Free plan, no API key, markdown workspace + approvals |
| [Agent37](#agent37) | Managed (shared) | Free / $3.99/mo | No | — | Free tier, cheap paid plans |
| [LumaDock](#lumadock) | VPS template | $4.99/mo (annual) | Possible | — | Budget VPS |
| [Hetzner](#hetzner) | DIY VPS | See Hetzner | Yes | Yes | Best value self-host |
| [Alibaba Cloud](#alibaba-cloud) | VPS template | $4/mo | No (Qwen via API) | No | Asia-Pacific, Qwen models |
| [Contabo](#contabo) | VPS template | €4.50/mo | Possible | Partial | Global budget VPS |
| [Railway](#railway) | PaaS | $5/mo | No | No | Testing / development |
| [Hostinger](#hostinger) | Managed apps | $5.99/mo (promo) | No | — | Managed AI automation apps |
| [OpenClaw Launch](#openclawlaunch) | Managed | $6/mo | No | No | AI credits, fast setup |
| [MyClaw.ai](#myclawai) | Managed | $19/mo | No | Partial | Dedicated managed, also Hermes/Claude Code |
| [OneClickClaw.io](#oneclickclaw) | Managed VPS | €14.99/mo | Yes (Hobbyist, Pro) | Yes | OpenClaw or Hermes Agent, 7-day free trial |
| [OpenClaw Cloud](#openclaw-cloud) | Managed | $19/mo | Free model | Yes | Free trial, own URL |
| [ClawHosters](#clawhosters) | Managed VPS | €19/mo | — | Yes | GDPR, German servers |
| [Clawbase](#molty-hosting) | Managed | $19.99/mo | No | — | Browser dashboard |
| [ClawBook.io](#clawbookio) | Managed | $20/mo | — | Partial | Crypto payments, global |
| [xCloud](#xcloud) | Managed | $9.99/mo (promo, renews $19.99) | No | Partial | Beginners, white-label |
| [DigitalOcean](#digitalocean) | VPS 1-Click | $24/mo | No | No | Developers |
| [ClawdHost](#clawdhost) | Managed | $29/mo | No | — | Simple single plan |
| [BoostedHost](#boostedhost) | VPS | Varies | Possible | — | Performance, Auto-Burst |
| [Everpod](#everpod) | Managed | $29/mo | — | — | One customer per machine, model usage included |
| [OpenClawHosting.io](#openclawhosting) | BYOS Managed | $29/mo | Yes (GPU) | — | Multi-instance teams |
| [MoltBotHost](#moltbothost) | BYOS Managed | $29/mo | Yes (GPU) | Partial | Bring your own server |
| [SEAOTTER](#seaotter) | Managed Hermes, **not OpenClaw** | $99/mo | No | — | Hermes Agent only |

:::warning
**Model costs are usually separate.** Most providers require your own LLM API keys, and an always-on agent can run up large bills. Set spending limits in your provider's console; see [Cost Management](/guides/cost-management).
:::

---

## Fully Managed Hosting

These providers run the server for you.

### xCloud {#xcloud}

Managed OpenClaw on a cloud VPS, set up for you.

- **URL**: [xcloud.host/openclaw-hosting](https://xcloud.host/openclaw-hosting/)
- **Price** (as of 2026-10-18): from $9.99/month for the first term, renewing at $19.99/month; six VPS sizes up to 120 GB RAM
- **Setup**: ~5 minutes, no Docker/terminal
- **Channels**: Telegram, WhatsApp (the earlier "Discord, Slack, Signal in Q2 2026" roadmap item is unverified)
- **Features**: Free SSL, daily encrypted backups, 24/7 live expert support
- **Local LLMs**: No — API keys only (BYOK)
- **Also offers**: White-label enterprise tier with SLA

### MyClaw.ai {#myclawai}

Managed hosting with dedicated instances. It now also hosts Hermes, Claude Code and Codex.

- **URL**: [myclaw.ai](https://myclaw.ai)
- **Pricing** (as of 2026-10-18, from the site's pricing page):

| Plan | Price |
|------|-------|
| Lite | $19/mo |
| Pro | $39/mo |
| Max | $79/mo |

- **Includes** (all plans, per the provider): always-on uptime, automatic updates; team plans are priced per seat

- **Channels**: WhatsApp, Telegram, Discord, Slack
- **Security**: Isolated container per plan with encrypted access

### OpenClaw Launch {#openclawlaunch}

Visual configurator with one-click deploy. It now also hosts Hermes and Claude Code.

- **URL**: [openclawlaunch.com](https://openclawlaunch.com)
- **Pricing** (as of 2026-10-18, not re-checked in detail):

| Plan | Price | Features |
|------|-------|----------|
| Lite | $6/mo | 1 instance, AI credits included |
| Pro | $20/mo | Up to 3 instances, more AI credits, dedicated resources |

- **Setup**: Under a minute, per the provider; no terminal or Docker needed
- **Channels**: Telegram, Discord, Web gateway
- **Features**: Browser-based visual configurator, isolated Docker containers, E2E encryption

### OpenClaw Cloud {#openclaw-cloud}

Third-party managed service (setupopenclaw.com), not an official OpenClaw product. Includes a free AI model and custom URL.

- **URL**: [setupopenclaw.com](https://setupopenclaw.com)
- **Price** (as of 2026-10-18): $19/month | 3-day free trial (no card required)
- **Setup**: 60 seconds
- **Features**: Dedicated server (not shared), free AI model + skills pre-installed, daily encrypted backups, auto-updates, custom URL
- **GDPR**: Data encrypted at rest and in transit, full data export

### OpenClawd.ai {#openclawdai}

One of the first managed providers (launched February 2026). The site now reads mostly as a general OpenClaw information and deploy page, with Mac mini and Raspberry Pi guidance alongside cloud hosting.

- **URL**: [openclawd.ai](https://openclawd.ai)
- **Pricing**: not published (unverified)
- **Coverage**: Featured in [Yahoo Finance](https://finance.yahoo.com/news/openclawd-ai-launches-hosted-platform-143600648.html)

### ClawdHost {#clawdhost}

Simple single-plan pricing.

- **URL**: [clawdhost.net](https://clawdhost.net)
- **Price** (as of 2026-10-18): $29/month, bring your own API key
- **Setup**: 60 seconds
- **Channels**: WhatsApp, Telegram, Discord, Slack
- **Features**: Dedicated instance, unlimited tasks

### Agent37 {#agent37}

Low-cost managed hosting on shared containers. It hosts both OpenClaw and Hermes.

- **URL**: [agent37.com/personal](https://www.agent37.com/personal) (the old `/openclaw` address redirects here). The [agent37.com](https://www.agent37.com) homepage now sells metered cloud sandboxes for agents; the OpenClaw and Hermes plans below are on `/personal`.
- **Pricing** (as of 2026-10-18, [source](https://www.agent37.com/personal)):

| Plan | Price | Specs |
|------|-------|-------|
| Free | $0 | 1 agent, sleeps when idle |
| Basic | $3.99/mo | BYOK, 1 vCPU, 4 GB RAM, 8 GB storage |
| Plus | $9.99/mo | Free models included |
| Pro | $29.99/mo | Built-in browser, 2 vCPU, 8 GB RAM |
| Max | $99.99/mo | Teams, 4 vCPU, 16 GB RAM |

- **Notable**: Open-source [host kit](https://github.com/agent37-platform/openclaw-host-kit) on GitHub (24 stars as of 2026-10-18)

:::info
Agent37 uses shared containers, not dedicated VMs. Fine for experimenting; consider dedicated hosting for production or sensitive data.
:::

### SEAOTTER {#seaotter}

Managed Hermes Agent control plane on Google Cloud — not OpenClaw hosting, and not OtterScore / seaotter.ai.

- **URL**: [seaotter.dev](https://seaotter.dev/)
- **Price**: **$99/agent/month** after a 7-day no-card trial
- **Setup**: typically a few minutes; no VPS or SSH
- **Features**: Per-agent isolation, MCP from Cursor / Claude / Codex, lifecycle APIs

### Clawbase (formerly Molty Hosting) {#molty-hosting}

- **URL**: [molthq.com](https://www.molthq.com) (the site is now branded Clawbase)
- **Price** (as of 2026-10-18): Starter $19.99/month, Pro $39.99/month, Power $79.99/month
- **Features**: Dedicated cloud server, OpenClaw pre-installed, browser access, no contracts
- **Channels**: iMessage, WhatsApp, Telegram, Slack

### ClawHosters {#clawhosters}

GDPR-compliant managed hosting on German VPS infrastructure.

- **URL**: [clawhosters.com](https://clawhosters.com)
- **Pricing** (as of 2026-10-18, entry price checked):

| Plan | Price | Specs |
|------|-------|-------|
| Budget | €19/mo | 2 vCPU, 4 GB RAM, 40 GB SSD |
| Balanced | €35/mo | 4 vCPU, 8 GB RAM, 80 GB SSD |
| Pro | €59/mo | 8 vCPU, 16 GB RAM, 160 GB SSD |

- **Setup**: Under a minute
- **Channels**: Telegram, WhatsApp, Discord, Slack
- **Features**: Dedicated German VPS, 99.9% uptime, automatic updates and backups
- **GDPR**: Full compliance (German data centers)
- **LLM**: BYOK (bring your own API keys — Anthropic, OpenAI, Google)

### OneClickClaw.io {#oneclickclaw}

Managed hosting on a dedicated EU server for each customer, with OpenClaw or Hermes Agent installed on the same plans and prices.

- **URL**: [oneclickclaw.io/openclaw](https://oneclickclaw.io/openclaw)
- **Pricing** (regular prices, as of 2026-10-18, [source](https://oneclickclaw.io/openclaw)):

| Plan | Monthly | Annual | Specs |
|------|---------|--------|-------|
| Starter | €14.99/mo | €149.88/yr | 2 vCPU, 4 GB RAM, 15 GB NVMe SSD |
| Hobbyist | €25.99/mo | €251.88/yr | 4 vCPU, 8 GB RAM, 25 GB NVMe SSD |
| Pro | €49.99/mo | €479.88/yr | 8 vCPU, 16 GB RAM, 40 GB NVMe SSD |

- **Free trial**: 7 days on a dedicated Starter server, sign in with a Google account, no credit card. The trial server and its data are removed at the end of day 7 unless a payment method is added
- **Setup**: Under 10 minutes for OpenClaw; the terminal and server setup are handled for you
- **Infrastructure**: Dedicated single-tenant VPS on Webdock in Denmark (EU), AMD EPYC processors
- **Channels**: Telegram, WhatsApp, Discord, Web Chat and more (20+ channels)
- **LLM**: BYOK from 25+ providers, or sign in with a ChatGPT or Grok subscription (Hermes Agent also accepts Nous Portal and MiniMax). AI usage is billed by your own provider
- **Local LLMs**: Ollama on the Hobbyist and Pro plans
- **Features**: SSL and custom domain, firewall, daily and weekly snapshots, DDoS protection, 24/7 health monitoring, auto-updates with version pinning, optional SSH access
- **Payment**: Stripe in EUR (Visa, Mastercard, American Express, SEPA Direct Debit), monthly or annual, cancel any time
- **GDPR**: Servers in Denmark, operated from Greece (EU)
- **Hermes Agent**: Same plans and prices at [oneclickclaw.io/hermes](https://oneclickclaw.io/hermes)
- **Temporary promotion**: on 2026-10-18 the site's page title advertised a "Halloween Sale from €9.99". The page text does not state the sale's terms or end date, and the regular prices above are unchanged, so the table keeps them.

### ClawBook.io {#clawbookio}

Global presence with cryptocurrency payment support.

- **URL**: [clawbook.io](https://clawbook.io)
- **Price**: From $20/month (not re-checked 2026-10-18)
- **Locations**: US (NYC, LA, Miami), Europe (Amsterdam, Frankfurt, London), Asia-Pacific (Singapore, Tokyo)
- **Features**: Docker isolation, UFW firewall, SSL/TLS, auto security patches
- **Payment**: Credit cards, PayPal, Bitcoin, Ethereum

### Clowd.bot {#clowdbot}

Pay per launch, no subscription.

- **URL**: [clowd.bot](https://clowd.bot)
- **Price** (as of 2026-10-18): $0.50 per instance launch + LLM token costs
- **Features**: No idle infrastructure cost, no minimums, no hourly compute fees
- **Channels**: WhatsApp, Telegram, Discord, Slack
- **Best for**: Occasional users who don't need 24/7 uptime

### Everpod {#everpod}

Managed OpenClaw hosting. Your own open-source AI agent gets a pod: a private, always-on cloud computer of its own, set up, secured and backed up for you.

- **URL**: [everpod.ai](https://everpod.ai)
- **Price**: $29/month with up to $10 of model usage included each month, cancel anytime | Bigger plans from $59/month
- **Developer pods** (as of 2026-10-18, [source](https://everpod.ai)): a separate product where you run the agent yourself over SSH through your own Tailscale network, with your own model plan or key and no model usage included. From $24/month (S: 4 vCPU, 8 GB RAM, 80 GB); M $42/month (8 vCPU, 16 GB, 160 GB); L $79/month (16 vCPU, 32 GB, 320 GB). Everpod says OpenClaw can be installed on one if you prefer to run it yourself
- **Setup**: About 15 minutes; nothing to install, no technical knowledge needed
- **Channels**: Telegram, Discord, Slack, WhatsApp, Signal and 20+ more
- **Models**: OpenAI, Anthropic, Google, DeepSeek and more; usage capped by your plan; bring your own model key and nothing is added on top
- **Security**: One machine per customer; no incoming connections from the open internet unless you switch on a public address for your agent; sign-in by a code sent to your email
- **Features**: Daily backups with restores tested, updates applied for you after testing, a control panel for your agent
- **Data**: A full copy of your pod's data on request, in a common archive format; on cancellation, everything, backups included, is permanently deleted 7 days after the paid period ends
- **Hosting**: Pods are hosted in Europe
- **Company**: Operated by DEH Technologies LLC, a Wyoming (United States) company ([about](https://everpod.ai/about))

### Aplite {#aplite}

Managed OpenClaw with a workspace on top. Each workspace is a standard OpenClaw runtime in its own container, set up from the browser in about a minute; models come through a metered account, so no API key is needed.

- **URL**: [aplite.ai/docs/openclaw](https://aplite.ai/docs/openclaw)
- **Pricing**:

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 1 agent, the full workspace, 300 welcome credits; the workspace sleeps between uses |
| Pro | $20/mo | 2,000 credits/mo, 6 agents, always-on, schedules/triggers/chains, 5 published sites |
| Power | $50/mo | 6,000 credits/mo, 20 agents, agent browser (headless Chromium), 15 published sites, doubled resources |

- **Setup**: About a minute — no server, no config files, no device pairing by hand
- **Channels**: Browser chat and Telegram (bot token from @BotFather); results can also be delivered to email or into a note
- **Models**: Any model from the catalog (Anthropic, OpenAI, Google, DeepSeek and more via OpenRouter), picked per agent; prepaid credits, 1 credit = 1¢, cost shown per answer. No API key needed — BYOK is not supported
- **Local LLMs**: No
- **Features**: A markdown workspace the agents read and write, scheduled routines and triggers (paid plans), an approval queue for file edits and anything leaving the workspace, pages published at a link, a curated skills catalog
- **Security**: One container per workspace with its own storage and network; no shell or raw `openclaw.json` access — agents, skills and models are configured in the browser
- **Data**: Notes and agent files are plain `.md`; any note downloads as a file
- **Hosting**: Germany (netcup, Nuremberg); operated by PIKsolution OÜ, Tallinn, Estonia (EU)
- **Trade-offs**: Catalog models only, OpenClaw releases arrive after the provider has tested them, no arbitrary packages on the server — see [what differs from self-hosting](https://aplite.ai/docs/openclaw)
- **Status**: Independent service, not affiliated with the OpenClaw project

---

## BYOS (Bring Your Own Server) Platforms

These manage OpenClaw on servers you provision from cloud providers. You pay the platform fee + your VPS cost.

### OpenClawHosting.io {#openclawhosting}

Multi-instance management for teams.

- **URL**: [openclawhosting.io](https://openclawhosting.io)
- **Pricing** (as of 2026-10-18, entry price checked):

| Plan | Price | Instances | Annual |
|------|-------|-----------|--------|
| Solo | $29/mo | 2 | $23/mo |
| Team | $49/mo | 10 | $39/mo |
| Business | $149/mo | Unlimited | $119/mo |

- **Features**: Deploy in under 2 min, multi-instance dashboard
- **Local LLMs**: Yes — Ollama support with GPU (8GB+ VRAM)
- **14-day money-back guarantee**

### MoltBotHost {#moltbothost}

- **URL**: [moltbothost.com](https://moltbothost.com)
- **Price** (as of 2026-10-18): from $29/month + cloud provider costs
- **Supported providers**: DigitalOcean, Vultr, Hetzner, AWS, Akamai, or any Linux server
- **Features**: Privacy-first with persistent memory, 50+ integrations
- **Local LLMs**: Supported on GPU-capable servers

### Elest.io {#elestio}

Multi-cloud flexibility with hourly billing.

- **URL**: [elest.io/open-source/openclaw](https://elest.io/open-source/openclaw)
- **Price**: hourly credit-based, with trial credits (amount not re-checked 2026-10-18)
- **Supported clouds**: Netcup, Hetzner, DigitalOcean, Vultr, Linode, Lightsail, Scaleway, AWS
- **Features**: Choose your cloud + region, 3 support tiers (first level free)

---

## VPS Providers with OpenClaw Templates

These are general cloud providers with one-click OpenClaw deployment. You manage the server yourself.

### Oracle Cloud (Free Tier) {#oracle-cloud}

A free ARM VM large enough for OpenClaw and a small local model.

- **Guide**: [docs.openclaw.ai/install/oracle](https://docs.openclaw.ai/install/oracle)
- **Price**: $0/month (Always Free tier)
- **Specs**: up to 4 OCPU, 24 GB RAM, 200 GB storage (`VM.Standard.A1.Flex`), per the upstream guide
- **Local LLMs**: Yes — enough for 7B parameter models or quantized 13B
- **Catch**: ARM (`aarch64`), not x86; free-tier capacity is limited, so instance creation can fail with "Out of capacity"


### Hetzner {#hetzner}

Self-managed VPS in the EU.

- **Guide**: [docs.openclaw.ai/install/hetzner](https://docs.openclaw.ai/install/hetzner)
- **Sizing**: upstream asks for at least 6 GB RAM to build the image from source; a smaller server works with the official pre-built image
- **Server types** (as of 2026-10-18): cost-optimized CX23/CX33/CX43 (x86) and CAX11/CAX21 (Arm). The old CX11 is retired. Prices are on [hetzner.com/cloud](https://www.hetzner.com/cloud/) (not re-checked here)
- **Locations**: Germany, Finland
- **GDPR**: Full compliance (German/Finnish data centers)
- **Local LLMs**: Possible on larger instances

### Contabo {#contabo}

Budget VPS with an OpenClaw page.

- **URL**: [contabo.com/en/openclaw-hosting](https://contabo.com/en/openclaw-hosting/)
- **Pricing** (entry price as of 2026-10-18; other tiers not re-checked):

| Plan | Price | Best For |
|------|-------|----------|
| Cloud VPS 10 | €4.50/mo | Personal use |
| Cloud VPS 20 | €7/mo | Power user |
| Cloud VPS 40 | €25/mo | Team deployment |
| Cloud VPS 60 | €49/mo | Enterprise scale |

- **Locations**: 9 regions, 11 locations globally
- **Features**: Unlimited traffic, DDoS protection, full data ownership

### Hostinger {#hostinger}

Hostinger's former OpenClaw VPS page now redirects to its managed "AI automation apps" plan.

- **URL**: [hostinger.com/ai-automation-apps](https://www.hostinger.com/ai-automation-apps)
- **Price** (as of 2026-10-18): $5.99/month on a 24-month term, $7.99 on 12 months, $10.99 month-to-month; renews at $11.99/month. One plan runs OpenClaw, Hermes Agent, n8n or Paperclip, with AI credits included
- **Note**: The earlier KVM 1 / KVM 2 OpenClaw template prices on this page are no longer listed

### DigitalOcean {#digitalocean}

1-Click Marketplace Droplet. Upstream warns to review third-party 1-click images' startup scripts and firewall defaults; a plain Droplet with the normal install is in [Deployment Options](/guides/deployment-options#digitalocean).

- **URL**: [marketplace.digitalocean.com/apps/openclaw](https://marketplace.digitalocean.com/apps/openclaw)
- **Price**: From $24/month (4 GB RAM Droplet; not re-checked 2026-10-18)
- **Features** (per the listing): Docker isolation, unique Gateway token, firewall rules, non-root execution, fail2ban

### Alibaba Cloud {#alibaba-cloud}

OpenClaw image on a Simple Application Server, wired to Alibaba Cloud Model Studio.

- **URL**: [alibabacloud.com/en/campaign/ai-openclaw](https://www.alibabacloud.com/en/campaign/ai-openclaw)
- **Price**: From $4/month (Simple Application Server; not re-checked 2026-10-18)
- **Locations**: 19 global regions
- **Features**: Pre-installed OpenClaw image, one-click setup, integrated with Alibaba Cloud Model Studio
- **Models**: Qwen models through the Model Studio API (not local)

### LumaDock {#lumadock}

- **URL**: [lumadock.com/vps-hosting/openclaw](https://lumadock.com/vps-hosting/openclaw)
- **Price** (as of 2026-10-18): VPS.S1 (2 vCPU, 2 GB RAM) $4.99/month billed yearly, $5.99 monthly; VPS.S2 (4 GB RAM) from $7.99
- **Features**: Pre-installed on Ubuntu 24.04, AMD EPYC, NVMe SSD, unmetered bandwidth, DDoS protection, snapshots/backups
- **Refund**: 30 days

### BoostedHost {#boostedhost}

- **URL**: [boostedhost.com/openclaw-vps-hosting](https://boostedhost.com/openclaw-vps-hosting/)
- **Features**: NVMe SSD, high-clock CPUs, **Auto-Burst Scaling** (borrows extra power during spikes), dedicated IPv4, 18+ countries

### LightNode {#lightnode}

- **URL**: [go.lightnode.com/moltbot-vps](https://go.lightnode.com/moltbot-vps)
- **Price**: Hourly billing
- **Locations**: **40+ locations** across US, Europe, Middle East, Asia, South America
- **Features**: Static IP, rapid provisioning

### Railway {#railway}

- **URL**: [railway.com/deploy/openclaw](https://railway.com/deploy/openclaw)
- **Price**: Free trial credit, then Hobby $5/month (not re-checked 2026-10-18)
- **Features**: One-click deploy, web-based setup wizard, state persisted to Railway Volume, auto reverse proxying with auth, one-click backup exports
- **Best for**: Development and testing

### Other VPS Providers

| Provider | Starting Price | Notable Feature |
|----------|---------------|-----------------|
| [**IONOS**](https://www.ionos.com) | Budget | Double CPU cores vs. competitors |
| [**Serverion**](https://www.serverion.com/molt-bot-hosting/) | Custom | Full management service available |
| [**ZAP-Hosting**](https://zap-hosting.com/en/vps-for-openclaw/) | Varies | VPS or dedicated server |

---

## Done-for-you setup

### Managed OpenClaw {#managed-openclaw}

- **URL**: [managedopenclaw.com](https://managedopenclaw.com)
- **Model**: Done-for-you setup and operations on a server, rather than a hosting plan
- **Price** (as of 2026-10-18): managed deployment $199 one-off; support plans from $49/month; enterprise from $499/month

---

## Serverless & Edge

### Cloudflare {#cloudflare}

Upstream has an experimental Cloudflare Containers template; Cloudflare's older Moltworker proof of concept is unmaintained. Costs are a Workers Paid plan plus container compute. See [Deployment Options](/guides/deployment-options#moltworker).

---

## Comparison Resources

Comparison sites and reviews. Several are run by hosting companies or earn affiliate fees:

| Site | Focus |
|------|-------|
| [bestclawhosting.com](https://www.bestclawhosting.com/) | Pricing, security ratings, honest verdicts |
| [HostAdvice](https://hostadvice.com/ai-hosting/openclaw-vps-hosting/) | 10 Best VPS for OpenClaw Hosting |
| [Seahawk Media](https://seahawkmedia.com/hosting/top-openclaw-vps-hosting/) | Top 11 Providers Compared |
| [xCloud Guide](https://xcloud.host/best-openclaw-hosting-providers/) | 7 Best Providers (xCloud-biased) |
| [BoostedHost Guide](https://boostedhost.com/blog/en/top-5-best-openclaw-hosting-vps-providers/) | Top 5 Providers (BoostedHost-biased) |
| [Deploy Cost Guide](https://yu-wenhao.com/en/blog/2026-02-01-openclaw-deploy-cost-guide/) | $0-8/month budget guide |
| [The Register](https://www.theregister.com/2026/02/04/cloud_hosted_openclaw/) | "Clouds rush to deliver OpenClaw-as-a-service" |

---

## Security Warnings

Before choosing a provider, be aware of these risks:

- **API cost runaway**: Set spending limits on your LLM API accounts
- **Outdated versions**: Ask which OpenClaw version the provider runs and how fast it applies updates. CVE-2026-25253 (fixed in 2026.1.29) is one of hundreds of published advisories; see [Known Vulnerabilities](/security/known-vulnerabilities)
- **Exposed gateways**: Internet scans in February 2026 found [42,665 exposed instances (Shodan, Feb 9) and 135,000+ in follow-up scans](/security/known-vulnerabilities#exposed-instances-january-february-2026). On a VPS, keep `gateway.bind` on loopback and reach it through an SSH tunnel or Tailscale ([hardening](/security/hardening))
- **Third-party installers**: Some providers advertise `curl -fsSL https://<provider>/install | bash`. That runs the provider's script with your privileges. Read it first, or use the [official installer](https://docs.openclaw.ai/install)
- **Managed hosting privacy**: Your conversations, memory and API keys sit on the provider's infrastructure. Review their privacy policy and data handling practices

See [Security Overview](/security/overview) and [Security Hardening](/security/hardening) for detailed guidance.

## Listing policy

- **Who can be listed**: any service that hosts or manages OpenClaw for customers, or a VPS provider with an OpenClaw-specific template or guide. Services for other agents (for example Hermes) are listed only when clearly labelled.
- **Disclosure**: a pull request that adds or edits an entry must state the author's affiliation with the operator (owner, employee, contractor, affiliate, or none). Undisclosed vendor edits are reverted.
- **Prices are dated**: every price carries the date it was checked ("as of YYYY-MM-DD") and a link to the provider's own page.
- **Unverified claims are marked**: uptime, compliance, security and "first/only/best" claims are the vendor's own unless a source is cited. Clawdocs does not test these services.
- **Pruning**: entries whose site is unreachable, returns 404, or no longer offers OpenClaw are removed at the next review. Removed on 2026-10-18: Clawhost.dev (404; its `npx clawd deploy` line pointed at an unrelated npm package), RunClaw.ai (connection timeout), ClawRun.dev (HTTP 503), Kilo Claw (page redirects to the generic kilo.ai homepage), WZ-IT (OpenClaw page redirects to a generic managed-hosting page), Clawery (site no longer mentions OpenClaw) and NEAR AI (`near.ai/openclaw` returns 404).

## See Also

- [Deployment Options](/guides/deployment-options) — Self-hosted deployment methods (Docker, Kubernetes, Cloudflare Workers, 1Panel, Coolify)
- [Installation](/getting-started/installation) — Local installation guide
- [Local Models](/guides/local-models) — Running with Ollama or vLLM
- [Ecosystem](/reference/ecosystem) — All community tools and projects
