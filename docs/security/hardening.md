---
sidebar_position: 2
title: Security Hardening
description: Step-by-step guide to securing OpenClaw for production use
---

# Security Hardening

This guide walks through hardening OpenClaw from a default install to a production-ready deployment.

## Level 1: Essential (Do These First)

### Bind to Localhost

```yaml title="~/.openclaw/config.yml"
gateway:
  host: "127.0.0.1"  # NEVER use 0.0.0.0
  port: 18789
```

This is the single most important security step. Researchers found **40,000+ exposed instances** with public-facing gateways.

### Keep Updated

```bash
# Check current version
openclaw --version

# Update
npm update -g openclaw
```

Subscribe to [OpenClaw security advisories](https://github.com/openclaw/openclaw/security/advisories) for vulnerability notifications.

### Restrict Shell Commands

```yaml title="~/.openclaw/config.yml"
hands:
  shell:
    blocked_commands:
      - "rm -rf"
      - "shutdown"
      - "reboot"
      - "mkfs"
      - "dd"
      - "chmod 777"
      - "curl * | bash"
      - "wget * | bash"
```

## Level 2: Recommended

### Channel Allowlists

Only allow messages from known contacts:

```yaml title="~/.openclaw/config.yml"
channels:
  whatsapp:
    allowed_contacts:
      - "+1234567890"
  telegram:
    allowed_chat_ids:
      - 123456789
  discord:
    allowed_guild_ids:
      - "987654321"
```

### Browser Domain Restrictions

```yaml title="~/.openclaw/config.yml"
hands:
  browser:
    allowed_domains:
      - "github.com"
      - "*.google.com"
      - "news.ycombinator.com"
    blocked_domains:
      - "*.bank.com"
      - "*.gov"
```

### File System Restrictions

```yaml title="~/.openclaw/config.yml"
hands:
  filesystem:
    writable_paths:
      - "~/.openclaw"
      - "~/projects"
      - "/tmp/openclaw"
    readable_paths:
      - "~"  # Read access to home
    blocked_paths:
      - "~/.ssh"
      - "~/.gnupg"
      - "~/.aws"
      - "~/.config/gcloud"
```

### Memory Encryption

```yaml title="~/.openclaw/config.yml"
memory:
  encryption:
    enabled: true
    key_file: "~/.openclaw/memory.key"
```

## Level 3: Paranoid (For Sensitive Environments)

### Docker Sandboxing

Run the Hands in a container:

```yaml title="~/.openclaw/config.yml"
hands:
  sandbox:
    enabled: true
    type: "docker"
    image: "openclaw/sandbox:latest"
    network: false
    read_only_root: true
    writable_paths:
      - "/workspace"
```

### Local Models Only

Eliminate cloud API data exposure:

```yaml title="~/.openclaw/config.yml"
brain:
  provider: "local"
  local:
    endpoint: "http://localhost:11434"
    model: "llama3.1:70b"
    type: "ollama"
```

### Disable Skill Installation

```yaml title="~/.openclaw/config.yml"
skills:
  allow_install: false
  allow_clawhub: false
```

### Audit Logging

```yaml title="~/.openclaw/config.yml"
logging:
  audit:
    enabled: true
    path: "~/.openclaw/logs/audit.log"
    log_tool_calls: true
    log_memory_writes: true
    log_channel_messages: true
```

## Firewall Rules

If you must run on a server, use firewall rules:

```bash
# Only allow localhost access to gateway
sudo ufw deny 18789
sudo ufw allow from 127.0.0.1 to any port 18789
```

## Verification

After hardening, verify your configuration:

```bash
# Run security audit
openclaw security-check

# Verify gateway is not exposed
curl http://$(hostname):18789 && echo "EXPOSED!" || echo "OK - not accessible"

# Check for outdated skills
openclaw clawhub outdated
```

## See Also

- [Security Overview](/security/overview) — Threat model and attack surfaces
- [Known Vulnerabilities](/security/known-vulnerabilities) — CVEs and incidents
- [Configuration Reference](/reference/configuration) — All security settings
