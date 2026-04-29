---
layout: home
hero:
  name: dicode
  text: You describe it. AI builds, ships, and fixes it.
  tagline: A task kernel with AI at every stage. Single binary, zero infrastructure, everything versioned in git. Open source, free forever.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/
    - theme: alt
      text: View on GitHub
      link: https://github.com/dicode-ayo/dicode-core
features:
  - icon: "\U0001F504"
    title: AI at Every Stage
    details: "AI creates tasks from plain English, validates before deploy, monitors runs, and auto-fixes failures. A continuous loop — create, validate, deploy, monitor, fix. Every step is a git commit you can review. BYO any OpenAI-compatible LLM."
    link: /concepts/ai-agent
    linkText: AI Agent & MCP docs
  - icon: "\U0001F4C1"
    title: Everything Is a Task
    details: "The AI engine, web dashboard, notifications, MCP servers — all replaceable tasks. dicode is a task kernel: a minimal Go binary that handles scheduling, runtimes, git sync, and security. Everything above that layer is a task you can swap out. Don't like something? Replace the task."
    link: /concepts/tasks
    linkText: Task format docs
  - icon: "\U0001F5C3"
    title: GitOps-Native — ArgoCD Without the Cluster
    details: "What's in git is what's running. Always. The reconciler watches your repo, computes content hashes, and auto-syncs. Save a file — live in 100ms via fsnotify. Push to git — live in under 1 second via webhook. No restart, no deploy step. The same declarative model as ArgoCD/Flux, but for automation tasks on any machine."
    link: /concepts/hot-reload
    linkText: Hot reload & dev workflow
  - icon: "\U0001F9E9"
    title: MCP Tool Factory
    details: "Every task you write becomes an AI tool. Agents (Claude Code, Cursor, GPT) connect via MCP, discover your tasks, and call them with typed params. Your code, your git, your control — unlike tool marketplaces where you consume someone else's black box. Want different tool sets? Multiple MCP server tasks with different permissions."
    link: /concepts/mcp-server
    linkText: MCP server docs
  - icon: "\U0001F310"
    title: Public URLs Without ngrok
    details: "Built-in webhook relay gives every task a stable public endpoint behind any NAT or firewall. Your IoT sensor, GitHub webhook, or Stripe event reaches your laptop instantly. ECDSA P-256 cryptographic identity, ECIES end-to-end encryption, challenge-response auth. No accounts, no config, no monthly bill."
    link: /concepts/relay
    linkText: Webhook relay docs
  - icon: "\U0001F511"
    title: One-Click OAuth (14 Providers)
    details: "Click Connect in the UI, authenticate with the provider, token appears in your daemon — encrypted end-to-end. No app registration, no client secrets, no callback URLs. GitHub, Slack, Google, Discord, GitLab, Spotify, Linear, Notion, Stripe, Salesforce, Office 365, Azure AD, Airtable, Confluence."
    link: /concepts/relay
    linkText: OAuth broker docs
  - icon: "\U0001F6E1"
    title: Zero Infrastructure — Works Offline
    details: "Single binary, zero external dependencies. No Postgres, no Redis, no Docker required. Embedded SQLite, local encrypted secrets (ChaCha20-Poly1305, Argon2id). Works fully offline and air-gapped. Runs on a Raspberry Pi with 50MB RAM. Cross-compiled for Linux, macOS, Windows on amd64 and arm64."
    link: /getting-started/
    linkText: Installation guide
  - icon: "\U0001F4BB"
    title: Four Runtimes
    details: "Deno (TypeScript/JavaScript) with npm: imports, Python via uv with PEP 723 inline deps, Docker with live log streaming, and Podman for rootless containers. All auto-installed and version-pinnable per task. SDK globals (params, kv, output, dicode) injected automatically."
    link: /concepts/runtimes
    linkText: Runtime docs
  - icon: "\U0001F510"
    title: Encrypted Secrets & Permissions Sandbox
    details: "ChaCha20-Poly1305 encrypted local store with Argon2id key derivation. Resolve secrets through provider tasks for Doppler / 1Password / HashiCorp Vault — author your own provider in a few lines, no daemon release needed. Every task declares exactly which files, networks, env vars, and APIs it can access. Zero ambient access — undeclared capabilities fail loudly."
    link: /concepts/secrets
    linkText: Secrets & permissions docs
  - icon: "\U0001F5A5"
    title: Throwaway UIs — Frontends Without Frameworks
    details: "Daemon tasks serve HTTP. Build webhook visualizers, team polls, approval gates, status dashboards, and simulation runners — 20 lines of code, no React, no build step. Git-versioned, disposable. Delete the folder and the UI is gone. Combine with KV store for persistent state and webhook relay for public access."
    link: /examples/throwaway-ui
    linkText: Throwaway UI examples
  - icon: "\U000023F0"
    title: Flexible Triggers & Task Chaining
    details: "Five trigger types: cron schedules, HTTP webhooks (with optional HMAC auth), manual execution, task chaining (on success/failure/always), and persistent daemon mode. Chain tasks into multi-step workflows — one task's return value becomes the next task's input. Or call tasks programmatically with dicode.run_task()."
    link: /concepts/triggers
    linkText: Trigger docs
  - icon: "\U0001F4E6"
    title: Task Sharing & Community Registry
    details: "Community tasks are git repos. Reference any task via a TaskSet git URL, override params for your environment, fork and customize. The registry is itself a TaskSet — no new format, no separate system. dicode task search and dicode task install from the CLI. Git is the package manager."
    link: /concepts/sharing
    linkText: Task sharing docs
  - icon: "\U0001F4E1"
    title: Runs on Many Machines
    details: "One git repo, independent daemons on whatever machines you like. Home server runs monitoring, laptop runs dev tasks, VPS handles public webhooks, Raspberry Pi collects sensor data. Each daemon reconciles the repo on its own — no orchestration layer, no service mesh, no shared cluster state. Git push reaches every machine within its poll interval (30s default, instant via webhook)."
    link: /concepts/sharing
    linkText: Running on multiple machines
  - icon: "\U0001F50D"
    title: Rich Web Dashboard
    details: "Full-featured UI: create tasks from prompts, manage TaskSets and sources, edit code with Monaco editor (with inline AI chat), view live logs via WebSocket, manage secrets, configure settings. Desktop tray app on macOS, Linux, Windows with failure notifications. Or go CLI-only — your choice."
    link: /getting-started/
    linkText: Getting started
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #3a8bfd 0%, #a0c4ff 100%);
}
</style>

## How it works

```
You describe ──→ AI generates ──→ Git commits ──→ dicode reconciles ──→ Task runs
```

1. **Describe** what you want to automate — in the web UI, CLI, or via an AI agent
2. **AI writes the code** — generates `task.yaml` + `task.ts`, validates it, commits to git
3. **GitOps reconciliation** — dicode watches your repo and auto-registers tasks within seconds
4. **Monitor & iterate** — live logs, run history, task chaining, all from the dashboard

## Quick example

A cron task that checks GitHub PRs every weekday morning:

::: code-group

```yaml [task.yaml]
apiVersion: dicode/v1
kind: Task
name: GitHub PR Digest
runtime: deno
trigger:
  cron: "0 9 * * 1-5"
permissions:
  env:
    - GITHUB_TOKEN
    - SLACK_WEBHOOK_URL
```

```typescript [task.ts]
const token = Deno.env.get("GITHUB_TOKEN")!;
const repo = await params.get("repo") ?? "my-org/my-repo";

const res = await fetch(`https://api.github.com/repos/${repo}/pulls?state=open`, {
  headers: { Authorization: `Bearer ${token}` },
});
const prs = await res.json();

const lastCount = (await kv.get("pr_count") as number) ?? 0;
if (prs.length !== lastCount) {
  await fetch(Deno.env.get("SLACK_WEBHOOK_URL")!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: `📋 ${prs.length} open PRs in ${repo}` }),
  });
  await kv.set("pr_count", prs.length);
}

return { prCount: prs.length };
```

:::

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  dicoded (daemon)                                           │
│                                                             │
│  Reconciler ──→ Registry ──→ Trigger Engine                 │
│                                     │                       │
│  AI Generation    Web Dashboard    Runtimes                 │
│                   + REST API       Deno · Python            │
│                   + MCP Server     Docker · Podman           │
│                                     │                       │
│  Relay Client ──→ WSS tunnel       SQLite                   │
└─────────────────────────────────────────────────────────────┘
  ▲ unix socket
  │
  dicode (CLI) ── run · list · logs · status · secrets
```

**Two binaries:** `dicoded` (daemon — runs everything) and `dicode` (CLI — auto-starts daemon, talks over Unix socket).

**No infrastructure required.** SQLite for storage, fsnotify for file watching, embedded web UI. One binary, zero dependencies.

## What's in the docs

<div class="cards">

| Section | What you'll learn |
|---------|-------------------|
| [**Getting Started**](/getting-started/) | Install, create your first task, configure dicode.yaml |
| [**Tasks**](/concepts/tasks) | task.yaml format, all fields, Docker config |
| [**Runtimes**](/concepts/runtimes) | Deno, Python, Docker, Podman — setup and features |
| [**Triggers**](/concepts/triggers) | Cron, webhook (with HTML UIs), manual, chain, daemon |
| [**SDK Globals**](/concepts/sdk) | params, kv, input, output, dicode, mcp — Deno & Python |
| [**Secrets**](/concepts/secrets) | Encrypted store, provider chain, CLI management |
| [**Sources & TaskSets**](/concepts/sources) | Git sources, local sources, TaskSet composition, dev mode |
| [**Task Sharing**](/concepts/sharing) | Community registry, overrides, multi-machine deployment |
| [**Hot Reload**](/concepts/hot-reload) | 100ms local reload, git webhook sync, dev mode |
| [**Webhook Relay & OAuth**](/concepts/relay) | NAT traversal, ECDSA identity, zero-setup OAuth |
| [**AI Agent**](/concepts/ai-agent) | Built-in AI chat, MCP server, skills, BYO provider |
| [**Throwaway UIs**](/examples/throwaway-ui) | Webhook visualizers, polls, approval gates, dashboards |
| [**Examples**](/examples/cron-task) | Cron task, webhook form, Docker container |

</div>

## Open source

dicode is AGPL-3.0 licensed and free to self-host — no feature gates, no trial limits. The full engine (reconciler, runtimes, scheduler, secrets, relay, MCP) is yours to run forever. The copyleft license ensures the code stays open.

[View on GitHub](https://github.com/dicode-ayo/dicode-core) · [Landing Page](https://dicode-ayo.github.io/dicode-site/)
