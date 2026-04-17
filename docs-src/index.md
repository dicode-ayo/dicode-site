---
layout: home
hero:
  name: dicode
  text: Automate anything. In plain English.
  tagline: GitOps-native task orchestrator with AI generation. Single binary, runs everywhere, free forever.
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
    details: AI creates tasks from English, validates before deploy, monitors runs, and auto-fixes failures. A continuous loop — every step is a git commit you can review.
  - icon: "\U0001F4C1"
    title: Everything Is a Task
    details: The AI engine, web dashboard, notifications, MCP servers — all replaceable tasks. dicode is a task kernel. Don't like something? Replace the task.
  - icon: "\U0001F5C3"
    title: GitOps-Native
    details: "What's in git is what's running. Content-hash reconciliation, 100ms hot reload on save, under 1 second via webhook. Like ArgoCD, without the cluster."
  - icon: "\U0001F9E9"
    title: MCP Tool Factory
    details: Every task becomes an AI tool. Agents connect via MCP, discover your tasks, and call them. Your code, your git, your control.
  - icon: "\U0001F310"
    title: Public URLs Without ngrok
    details: Built-in webhook relay gives every task a stable public endpoint behind any NAT. ECDSA-authenticated, ECIES-encrypted. No accounts, no config.
  - icon: "\U0001F511"
    title: One-Click OAuth (14 Providers)
    details: "Click Connect, authenticate, done. No app registration, no client secrets, no callback URLs. GitHub, Slack, Google, Discord, and 10 more."
  - icon: "\U0001F4BB"
    title: Four Runtimes
    details: "Deno (TypeScript), Python (uv), Docker, and Podman. Auto-installed, no setup. Pick the runtime that fits your task."
  - icon: "\U0001F510"
    title: Encrypted Secrets
    details: ChaCha20-Poly1305 encrypted local store. Pluggable provider chain for Doppler, 1Password, HashiCorp Vault. Secrets never leave your machine.
  - icon: "\U0001F5A5"
    title: Throwaway UIs
    details: "Daemon tasks serve HTTP. Build webhook visualizers, polls, approval gates, and dashboards — 20 lines of code, no framework, git-versioned."
  - icon: "\U0001F4E1"
    title: Multi-Machine Fleet
    details: Same git repo, multiple daemons on different machines. Home server, laptop, VPS, Raspberry Pi — all sync from one source of truth.
  - icon: "\U000023F0"
    title: Flexible Triggers
    details: Cron, HTTP webhooks, manual, task chaining, and persistent daemon mode. Every trigger pattern you need.
  - icon: "\U0001F4E6"
    title: Task Sharing & Registry
    details: Community tasks are git repos. Reference via TaskSet, override params for your environment. Git is the package manager.
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

dicode is open source and free to self-host — no feature gates, no trial limits. The full engine (reconciler, runtimes, scheduler, secrets, relay, MCP) is yours to run forever.

[View on GitHub](https://github.com/dicode-ayo/dicode-core) · [Landing Page](https://dicode-ayo.github.io/dicode-site/)
