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
    title: GitOps-Native Reconciliation
    details: Tasks live in git. dicode watches for changes, computes content hashes, and reconciles automatically — add, update, or delete tasks without restarting.
  - icon: "\U0001F916"
    title: AI Task Generation
    details: Describe your automation in plain English. dicode generates validated TypeScript or Python, commits it, and starts running immediately.
  - icon: "\U000023F0"
    title: Flexible Triggers
    details: Cron schedules, HTTP webhooks, manual execution, task chaining, and persistent daemon mode. Every trigger pattern you'll ever need.
  - icon: "\U0001F4BB"
    title: Four Runtimes
    details: "Deno (TypeScript), Python (uv), Docker, and Podman. Auto-installed, no setup. Pick the runtime that fits your task."
  - icon: "\U0001F50D"
    title: Rich Web Dashboard
    details: Monitor runs, view live logs, trigger tasks, manage sources, and edit config — all from a browser. The dashboard itself is a webhook task.
  - icon: "\U0001F517"
    title: Task Chaining
    details: Chain tasks together with typed outputs. One task's return value becomes the next task's input. Build multi-step workflows declaratively.
  - icon: "\U0001F510"
    title: Encrypted Secrets
    details: ChaCha20-Poly1305 encrypted local store with Argon2id key derivation. Provider chain falls back to env vars. Secrets never leave your machine.
  - icon: "\U0001F310"
    title: Webhook Relay + OAuth Broker
    details: Receive webhooks behind NAT via a persistent WebSocket tunnel. Zero-setup OAuth with 14 providers — GitHub, Slack, Google, and more. Tokens encrypted end-to-end.
  - icon: "\U0001F9E9"
    title: MCP Server
    details: Expose dicode as an MCP server so AI agents (Claude Code, Cursor) can list tasks, trigger runs, and control dev mode autonomously.
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
| [**Sources**](/concepts/sources) | TaskSets, git sources, local sources, dev mode |
| [**Webhook Relay & OAuth**](/concepts/relay) | NAT traversal, ECDSA identity, zero-setup OAuth, self-hosted options |
| [**Examples**](/examples/cron-task) | Cron task, webhook form, Docker container |

</div>

## Open source

dicode is open source and free to self-host — no feature gates, no trial limits. The full engine (reconciler, runtimes, scheduler, secrets, relay, MCP) is yours to run forever.

[View on GitHub](https://github.com/dicode-ayo/dicode-core) · [Landing Page](https://dicode-ayo.github.io/dicode-site/)
