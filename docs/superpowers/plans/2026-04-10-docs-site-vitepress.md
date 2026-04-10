# Docs Site with VitePress — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-facing documentation section to dicode-site using VitePress with left sidebar navigation, right-side "on this page" TOC, full-text search, and dark theme — deployed alongside the existing landing page on GitHub Pages.

**Architecture:** VitePress builds markdown files from `content/docs/` into static HTML. The existing landing page (`docs/index.html`) stays as-is at the root. VitePress output goes to `docs/docs/` so both coexist under the same GitHub Pages deployment. The CI workflow gets a build step before uploading.

**Tech Stack:** VitePress 1.x, Node.js 22, GitHub Actions, Markdown

---

## File Structure

```
dicode-site/
├── content/                          # VitePress source (markdown + config)
│   ├── docs/
│   │   ├── .vitepress/
│   │   │   └── config.ts            # VitePress config (sidebar, nav, theme, search)
│   │   ├── index.md                 # Docs landing page (overview + links)
│   │   ├── getting-started/
│   │   │   ├── index.md             # Installation & quickstart
│   │   │   ├── first-task.md        # Create your first task
│   │   │   └── configuration.md     # dicode.yaml reference
│   │   ├── concepts/
│   │   │   ├── tasks.md             # Task format (task.yaml + scripts)
│   │   │   ├── runtimes.md          # Deno, Python, Docker, Podman
│   │   │   ├── triggers.md          # Cron, webhook, manual, chain, daemon
│   │   │   ├── sdk.md               # SDK globals (params, kv, input, output, dicode, mcp)
│   │   │   ├── secrets.md           # Provider chain, local encrypted, env fallback
│   │   │   ├── sources.md           # TaskSet, git, local sources
│   │   │   └── relay.md             # Webhook relay for NAT traversal
│   │   └── examples/
│   │       ├── cron-task.md          # Cron-triggered TypeScript task
│   │       ├── webhook-task.md       # Webhook with HTML UI
│   │       └── docker-task.md        # Docker container task
│   └── package.json                  # Node.js deps (vitepress only)
├── docs/                             # GitHub Pages deploy root (output)
│   ├── index.html                    # Existing landing page (untouched)
│   └── docs/                         # VitePress build output (generated)
├── .github/
│   └── workflows/
│       └── pages.yml                 # Updated: adds VitePress build step
└── .gitignore
```

Key decisions:
- `content/` is the source directory, `docs/` is the deploy root
- VitePress builds to `docs/docs/` so docs live at `/docs/` on the site
- The landing page stays at `/` as a plain HTML file
- The nav bar on the landing page gets a "Docs" link pointing to `/docs/`

---

### Task 1: Initialize VitePress project

**Files:**
- Create: `content/package.json`
- Create: `content/docs/.vitepress/config.ts`
- Create: `content/docs/index.md`
- Modify: `.gitignore`

- [ ] **Step 1: Create package.json**

```bash
cd /workspaces/dicode-site
mkdir -p content/docs/.vitepress
```

Write `content/package.json`:

```json
{
  "name": "dicode-docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vitepress dev docs",
    "build": "vitepress build docs",
    "preview": "vitepress preview docs"
  },
  "devDependencies": {
    "vitepress": "^1.6.3"
  }
}
```

- [ ] **Step 2: Install VitePress**

```bash
cd /workspaces/dicode-site/content
npm install
```

Expected: `node_modules/` created, `package-lock.json` generated.

- [ ] **Step 3: Write VitePress config**

Write `content/docs/.vitepress/config.ts`:

```ts
import { defineConfig } from "vitepress";

export default defineConfig({
  title: "dicode",
  description: "Documentation for the dicode task orchestrator",
  base: "/docs/",
  outDir: "../../docs/docs",
  cleanUrls: true,

  head: [
    ["link", { rel: "icon", href: "/docs/favicon.ico" }],
  ],

  themeConfig: {
    logo: undefined,
    siteTitle: "dicode docs",

    nav: [
      { text: "Home", link: "https://dicode-ayo.github.io/dicode-site/" },
      { text: "Getting Started", link: "/getting-started/" },
      { text: "Concepts", link: "/concepts/tasks" },
      { text: "Examples", link: "/examples/cron-task" },
      {
        text: "GitHub",
        link: "https://github.com/dicode-ayo/dicode-core",
      },
    ],

    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Installation & Quickstart", link: "/getting-started/" },
          { text: "Your First Task", link: "/getting-started/first-task" },
          { text: "Configuration", link: "/getting-started/configuration" },
        ],
      },
      {
        text: "Concepts",
        items: [
          { text: "Tasks", link: "/concepts/tasks" },
          { text: "Runtimes", link: "/concepts/runtimes" },
          { text: "Triggers", link: "/concepts/triggers" },
          { text: "SDK Globals", link: "/concepts/sdk" },
          { text: "Secrets", link: "/concepts/secrets" },
          { text: "Sources & TaskSets", link: "/concepts/sources" },
          { text: "Webhook Relay", link: "/concepts/relay" },
        ],
      },
      {
        text: "Examples",
        items: [
          { text: "Cron Task (TypeScript)", link: "/examples/cron-task" },
          { text: "Webhook with UI", link: "/examples/webhook-task" },
          { text: "Docker Task", link: "/examples/docker-task" },
        ],
      },
    ],

    outline: {
      level: [2, 3],
      label: "On this page",
    },

    search: {
      provider: "local",
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/dicode-ayo/dicode-core",
      },
    ],

    editLink: {
      pattern:
        "https://github.com/dicode-ayo/dicode-site/edit/main/content/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
```

- [ ] **Step 4: Write docs landing page**

Write `content/docs/index.md`:

```markdown
---
layout: home
hero:
  name: dicode
  text: Documentation
  tagline: Learn how to automate anything with the GitOps-native task orchestrator
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/
    - theme: alt
      text: View on GitHub
      link: https://github.com/dicode-ayo/dicode-core
features:
  - icon: "🚀"
    title: Quick Setup
    details: Single binary, no infrastructure. Run locally or on a server in under a minute.
  - icon: "📝"
    title: Code-First Tasks
    details: Write tasks in TypeScript, Python, or Docker containers. Git is your source of truth.
  - icon: "🤖"
    title: AI-Powered
    details: Generate tasks from plain English. AI writes the code, dicode runs it.
  - icon: "🔌"
    title: MCP Server
    details: Expose tasks to AI agents via the Model Context Protocol. Claude Code, Cursor, and more.
---
```

- [ ] **Step 5: Update .gitignore**

Append to `.gitignore` (create if missing):

```
content/node_modules/
docs/docs/
```

- [ ] **Step 6: Test local dev server**

```bash
cd /workspaces/dicode-site/content
npx vitepress dev docs
```

Expected: Dev server starts at `http://localhost:5173/docs/`. Landing page with hero and feature cards renders. Dark theme toggle works. Search icon appears. Left sidebar shows (empty sections for now).

- [ ] **Step 7: Commit**

```bash
git add content/ .gitignore
git commit -m "feat: initialize VitePress docs project"
```

---

### Task 2: Write Getting Started docs

**Files:**
- Create: `content/docs/getting-started/index.md`
- Create: `content/docs/getting-started/first-task.md`
- Create: `content/docs/getting-started/configuration.md`

- [ ] **Step 1: Write installation & quickstart**

Write `content/docs/getting-started/index.md`:

```markdown
# Installation & Quickstart

dicode is a single Go binary — no runtime dependencies, no containers required.

## Install

Download the latest release for your platform:

```bash
# Linux (amd64)
curl -Lo dicode https://github.com/dicode-ayo/dicode-core/releases/latest/download/dicode-linux-amd64
chmod +x dicode && sudo mv dicode /usr/local/bin/

# macOS (Apple Silicon)
curl -Lo dicode https://github.com/dicode-ayo/dicode-core/releases/latest/download/dicode-darwin-arm64
chmod +x dicode && sudo mv dicode /usr/local/bin/
```

## Start the daemon

```bash
# The CLI auto-starts the daemon if not running
dicode list
```

This starts `dicoded` in the background and connects over a Unix socket. The web dashboard opens at [http://localhost:8080](http://localhost:8080).

## Local-only mode (no git needed)

dicode works entirely locally — git is optional. The daemon watches a local directory for task files:

```yaml
# ~/.dicode/dicode.yaml (auto-generated on first run)
sources:
  - type: local
    path: ~/dicode-tasks
    watch: true

database:
  type: sqlite

server:
  port: 8080
```

No tokens, no cloud accounts. Save a file to `~/dicode-tasks/` and the task is live within ~100ms.

## Add a git source (optional)

```yaml
sources:
  - type: git
    url: https://github.com/you/my-tasks
    branch: main
    auth:
      type: token
      token_env: GITHUB_TOKEN
```

The reconciler polls the repo every 30 seconds (or instantly on push webhook) and syncs tasks automatically.

## CLI commands

```bash
dicode list                          # list all registered tasks
dicode run <task-id> [key=value ...] # trigger a task and wait
dicode logs <run-id>                 # fetch log lines for a run
dicode status [task-id]              # daemon health or task status
dicode secrets list                  # list secret keys
dicode secrets set <key> <value>     # store a secret
dicode secrets delete <key>          # delete a secret
dicode version                       # print version
```

## Next steps

- [Create your first task](/getting-started/first-task)
- [Configure dicode.yaml](/getting-started/configuration)
- [Learn about runtimes](/concepts/runtimes)
```

- [ ] **Step 2: Write first task guide**

Write `content/docs/getting-started/first-task.md`:

```markdown
# Your First Task

Let's create a simple task that runs on a cron schedule.

## 1. Create the task directory

```bash
mkdir -p ~/dicode-tasks/hello-cron
```

## 2. Write task.yaml

```yaml
# ~/dicode-tasks/hello-cron/task.yaml
apiVersion: dicode/v1
kind: Task
name: Hello Cron
description: A simple task that runs every minute
runtime: deno

trigger:
  cron: "* * * * *"
```

## 3. Write the task script

```typescript
// ~/dicode-tasks/hello-cron/task.ts
const now = new Date().toISOString();
console.log(`Hello from dicode! Current time: ${now}`);

const count = (await kv.get("run_count") as number) ?? 0;
await kv.set("run_count", count + 1);
console.log(`This task has run ${count + 1} times`);

return { time: now, runCount: count + 1 };
```

## 4. Watch it run

The daemon picks up the new task within ~100ms. Open the dashboard at [http://localhost:8080](http://localhost:8080) to see it in the task list.

Or trigger it manually:

```bash
dicode run hello-cron
```

## 5. Check the logs

```bash
dicode logs <run-id>
```

## What happened

1. You created a directory with `task.yaml` + `task.ts`
2. The local source watcher detected the new files
3. The reconciler registered the task and started the cron trigger
4. The Deno runtime executed `task.ts` with injected SDK globals (`kv`, `params`, etc.)
5. The return value was stored in SQLite alongside the run log

## Next: runtimes

Tasks can also be written in Python or run as Docker containers. See [Runtimes](/concepts/runtimes).
```

- [ ] **Step 3: Write configuration reference**

Write `content/docs/getting-started/configuration.md`:

```markdown
# Configuration

dicode is configured via `dicode.yaml`, located at `~/.dicode/dicode.yaml` by default.

## Full reference

```yaml
# Task sources — git repos and/or local directories
sources:
  - type: git
    url: https://github.com/you/my-tasks
    branch: main
    poll_interval: 30s
    auth:
      type: token
      token_env: GITHUB_TOKEN

  - type: local
    path: ~/dicode-tasks
    watch: true

# Secrets provider chain (tried in order)
secrets:
  providers:
    - type: local    # encrypted SQLite (ChaCha20-Poly1305)
    - type: env      # host environment variables

# Push notifications
notifications:
  on_failure: true
  on_success: false
  provider:
    type: ntfy
    url: https://ntfy.sh
    topic: my-dicode-alerts
    token_env: NTFY_TOKEN

# Web UI and API server
server:
  port: 8080
  auth: false              # set true to require passphrase
  secret: ""               # passphrase (auto-generated if empty)
  allowed_origins: []      # CORS allowlist
  mcp: true                # MCP server at /mcp
  tray: true               # system tray icon

# AI task generation
ai:
  model: claude-sonnet-4-6
  api_key_env: ANTHROPIC_API_KEY
  # base_url: https://api.anthropic.com/v1

# Global task defaults
defaults:
  on_failure_chain: ""     # task to fire on any failure

# WebSocket relay for public webhook URLs
relay:
  enabled: false
  server_url: wss://relay.dicode.app

# Runtime version pinning
runtimes:
  deno:
    version: ""            # empty = bundled default
  python:
    version: "0.7.3"

log_level: info
data_dir: ~/.dicode
```

## Config variables

These variables can be used in any string value:

| Variable | Resolves to |
|----------|-------------|
| `${HOME}` | User's home directory |
| `${DATADIR}` | Value of `data_dir` |
| `${CONFIGDIR}` | Directory containing `dicode.yaml` |

## Environment variables

| Variable | Description |
|----------|-------------|
| `DICODE_DATA_DIR` | Override `data_dir` |
| `DICODE_MASTER_KEY` | Base64-encoded 32-byte key for local secrets encryption |
```

- [ ] **Step 4: Verify build**

```bash
cd /workspaces/dicode-site/content
npx vitepress build docs
```

Expected: Build succeeds, output in `../../docs/docs/`. Three getting-started pages with working sidebar navigation.

- [ ] **Step 5: Commit**

```bash
git add content/docs/getting-started/
git commit -m "docs: add getting started guides"
```

---

### Task 3: Write Concepts docs

**Files:**
- Create: `content/docs/concepts/tasks.md`
- Create: `content/docs/concepts/runtimes.md`
- Create: `content/docs/concepts/triggers.md`
- Create: `content/docs/concepts/sdk.md`
- Create: `content/docs/concepts/secrets.md`
- Create: `content/docs/concepts/sources.md`
- Create: `content/docs/concepts/relay.md`

- [ ] **Step 1: Write tasks.md**

Write `content/docs/concepts/tasks.md`:

```markdown
# Tasks

A task is a directory containing a `task.yaml` configuration file and a script file.

## Structure

```
my-task/
├── task.yaml       # metadata, trigger, params, env declarations
├── task.ts         # TypeScript script (Deno runtime)
└── task.test.ts    # optional tests (planned)
```

The script extension determines the runtime: `.ts`/`.js` for Deno, `.py` for Python. Docker tasks have no script file — the container image is specified in `task.yaml`.

## task.yaml

```yaml
apiVersion: dicode/v1
kind: Task
name: My Task
description: What this task does
runtime: deno          # deno | python | docker | podman

trigger:
  cron: "0 9 * * *"   # exactly one trigger required

params:
  channel:
    description: Slack channel
    default: "#general"

permissions:
  env:
    - SLACK_TOKEN      # only these env vars are accessible
    - API_KEY
```

### Trigger types

Exactly one trigger must be set:

| Type | Example | Description |
|------|---------|-------------|
| `cron` | `"0 9 * * *"` | Standard 5-field cron expression |
| `webhook` | `"/hooks/my-task"` | HTTP POST to this path |
| `manual` | `true` | Only via UI or API |
| `chain` | `from: other-task` | Fires when another task completes |
| `daemon` | `true` | Starts on boot, restarts on exit |

See [Triggers](/concepts/triggers) for details.

### Additional fields

```yaml
timeout: 120s                       # default: 60s
on_failure_chain: failure-handler   # task to fire on failure ("" to disable)
mcp_port: 3000                      # MCP server port (daemon tasks)

trigger:
  webhook: /hooks/my-task
  webhook_secret: "${MY_SECRET}"    # HMAC-SHA256 auth
  auth: true                        # require dicode session

security:
  allowed_tasks: ["*"]              # tasks callable via dicode.run_task()
  allowed_mcp: ["github-mcp"]       # MCP daemons callable via mcp.call()
```

### Docker runtime

```yaml
runtime: docker
docker:
  image: nginx:alpine
  pull_policy: missing              # always | missing | never
  ports:
    - "8888:80"
  volumes:
    - "/tmp:/usr/share/nginx/html:ro"
```

## Return values

Task scripts can return a JSON-serializable value. This is stored with the run and passed to downstream chain-triggered tasks via `input`.

```typescript
// Deno
return { count: 42, status: "ok" };
```

```python
# Python
result = {"count": 42, "status": "ok"}
```
```

- [ ] **Step 2: Write runtimes.md**

Write `content/docs/concepts/runtimes.md`:

```markdown
# Runtimes

dicode supports four task runtimes. Each is auto-installed on first use.

## Deno (TypeScript / JavaScript)

The default runtime. Tasks are TypeScript or JavaScript files executed by the [Deno](https://deno.com) runtime.

```yaml
runtime: deno
```

- Auto-installs the Deno binary on first use (version pinnable in config)
- Full TypeScript support — no build step needed
- Import npm packages inline: `import ... from "npm:package"`
- Native `fetch()` for HTTP requests
- SDK globals injected automatically (see [SDK Globals](/concepts/sdk))

```typescript
// task.ts
const res = await fetch("https://api.example.com/data", {
  headers: { Authorization: `Bearer ${Deno.env.get("API_TOKEN")}` },
});
const data = await res.json();
console.log("fetched", data.length, "items");
return { count: data.length };
```

## Python

Tasks are Python scripts executed by [uv](https://docs.astral.sh/uv/).

```yaml
runtime: python
```

- Auto-installs uv on first use (version pinnable)
- PEP 723 inline dependency declarations
- Async detection — `async def main()` is automatically awaited
- SDK globals injected at module level (no imports needed)

```python
# /// script
# dependencies = ["httpx"]
# ///
import httpx

res = httpx.get("https://api.example.com/data",
    headers={"Authorization": f"Bearer {env.get('API_TOKEN')}"})
data = res.json()
log.info("fetched items", count=len(data))
result = {"count": len(data)}
```

## Docker

Run any language in any container.

```yaml
runtime: docker
docker:
  image: python:3.12-slim
  ports: ["8080:8080"]
  volumes: ["/data:/app/data"]
  pull_policy: missing
```

Features: live log streaming, kill support, orphan container cleanup on startup, `dicode.run-id` / `dicode.task-id` labels for tracking.

## Podman

Rootless alternative to Docker.

```yaml
runtime: podman
docker:    # same config block
  image: python:3.12-slim
```

Requires Podman to be installed on the host.
```

- [ ] **Step 3: Write triggers.md**

Write `content/docs/concepts/triggers.md`:

```markdown
# Triggers

Every task has exactly one trigger that determines when it runs.

## Cron

Standard 5-field cron expression. Runs in local timezone.

```yaml
trigger:
  cron: "0 9 * * 1-5"    # weekdays at 9am
```

Missed-run catchup: if the daemon was offline during a scheduled time (within the last 24h), the task fires once on startup.

## Webhook

HTTP endpoint that triggers a task run. The request body is available as `input`.

```yaml
trigger:
  webhook: /hooks/my-task
```

Optional HMAC authentication (GitHub-compatible `X-Hub-Signature-256`):

```yaml
trigger:
  webhook: /hooks/my-task
  webhook_secret: "${MY_WEBHOOK_SECRET}"
```

Optional session auth for internal tools:

```yaml
trigger:
  webhook: /hooks/my-tool
  auth: true               # requires valid dicode session
```

### Webhook task UIs

If your task directory contains an `index.html`, the webhook handler serves it on GET requests. The `dicode.js` SDK is auto-injected for running tasks and streaming logs from the browser.

## Manual

Only triggerable from the web UI or REST API.

```yaml
trigger:
  manual: true
```

```bash
dicode run my-task param1=value1
```

## Chain

Fires when another task completes.

```yaml
trigger:
  chain:
    from: fetch-emails
    on: success            # success | failure | always
```

The upstream task's return value is available as `input` in the downstream task.

## Daemon

Starts on daemon boot and restarts based on policy.

```yaml
trigger:
  daemon: true
  restart: always          # always | on-failure | never
```

Daemon tasks run continuously — useful for long-lived services, system tray, and MCP server tasks.
```

- [ ] **Step 4: Write sdk.md**

Write `content/docs/concepts/sdk.md`:

```markdown
# SDK Globals

Deno and Python tasks get SDK globals injected automatically — no imports needed. They communicate with the daemon over a Unix socket IPC protocol.

::: tip Runtime differences
In **Deno** all methods are async (return Promises). In **Python** both sync and `_async` variants are available.
:::

## params

Access task parameters defined in `task.yaml`.

::: code-group
```typescript [Deno]
const channel = await params.get("slack_channel");   // string | null
const all = await params.all();                       // Record<string, string>
```
```python [Python]
channel = params.get("slack_channel")
channel = params.get("slack_channel", "#general")  # with default
all_params = params.all()
```
:::

## kv

Persistent key-value store scoped to the task. Survives restarts.

::: code-group
```typescript [Deno]
await kv.set("last_id", "msg_12345");
const id = await kv.get("last_id");
await kv.delete("last_id");
const all = await kv.list("prefix_");
```
```python [Python]
kv.set("last_id", "msg_12345")
id = kv.get("last_id")
kv.delete("last_id")
all = kv.list("prefix_")
```
:::

## input

Payload from upstream tasks (chain trigger) or webhook request body.

::: code-group
```typescript [Deno]
console.log(input.count);      // chain: upstream return value
console.log(input.body);       // webhook: request body
```
```python [Python]
print(input["count"])
```
:::

## output

Render rich output stored alongside the run.

::: code-group
```typescript [Deno]
await output.html("<h1>Report</h1>", { data: { count: 42 } });
await output.text("Done: 42 items");
await output.image("image/png", base64Content);
await output.file("report.csv", csvContent, "text/csv");
```
```python [Python]
output.html("<h1>Report</h1>", data={"count": 42})
output.text("Done: 42 items")
```
:::

## dicode

Run other tasks, query state, read config, manage secrets.

::: code-group
```typescript [Deno]
const result = await dicode.run_task("send-report", { channel: "#ops" });
const tasks = await dicode.list_tasks();
const runs = await dicode.get_runs("my-task", { limit: 5 });
const ai = await dicode.get_config("ai");

// Secrets management (Deno only)
await dicode.secrets_set("MY_TOKEN", "new-value");
await dicode.secrets_delete("OLD_TOKEN");
```
```python [Python]
result = dicode.run_task("send-report", {"channel": "#ops"})
tasks = dicode.list_tasks()
runs = dicode.get_runs("my-task", limit=5)
ai = dicode.get_config("ai")
```
:::

Requires `security.allowed_tasks` in `task.yaml`.

## mcp

Call tools on MCP daemon tasks.

::: code-group
```typescript [Deno]
const tools = await mcp.list_tools("github-mcp");
const result = await mcp.call("github-mcp", "search_repos", { query: "dicode" });
```
```python [Python]
tools = mcp.list_tools("github-mcp")
result = mcp.call("github-mcp", "search_repos", {"query": "dicode"})
```
:::

Requires `security.allowed_mcp` in `task.yaml`.

## Logging

::: code-group
```typescript [Deno]
console.log("info message");
console.warn("warning");
console.error("error", error.message);
```
```python [Python]
log.info("info message")
log.warn("warning")
log.error("error", error_message)
```
:::

## HTTP requests

Use native APIs — no special `http` global:

::: code-group
```typescript [Deno]
const res = await fetch("https://api.example.com/data");
const data = await res.json();
```
```python [Python]
# Use any library (declare in PEP 723)
import httpx
res = httpx.get("https://api.example.com/data")
```
:::

## Environment variables

::: code-group
```typescript [Deno]
const token = Deno.env.get("SLACK_TOKEN");
```
```python [Python]
token = env.get("SLACK_TOKEN")
```
:::

Only variables declared in `task.yaml` `permissions.env` are accessible.
```

- [ ] **Step 5: Write secrets.md**

Write `content/docs/concepts/secrets.md`:

```markdown
# Secrets

Tasks declare which secrets they need. dicode resolves them through a provider chain — a list of backends tried in order.

## Declaring secrets

```yaml
# task.yaml
permissions:
  env:
    - SLACK_TOKEN
    - GMAIL_TOKEN
```

Tasks can only access secrets they declare. Undeclared variables are not visible.

## Provider chain

```yaml
# dicode.yaml
secrets:
  providers:
    - type: local    # encrypted SQLite — checked first
    - type: env      # host environment variables — fallback
```

First provider with the key wins. If none have it, the task fails before execution.

## Local encrypted store

The `local` provider stores secrets in SQLite using **ChaCha20-Poly1305**. The encryption key is derived from a master key via **Argon2id**.

Master key resolution (in order):
1. `DICODE_MASTER_KEY` env var — base64-encoded 32 bytes
2. `~/.dicode/master.key` — auto-generated on first run (`chmod 600`)

::: warning
Back up `~/.dicode/master.key`. If lost, encrypted secrets cannot be recovered.
:::

### Managing secrets

```bash
dicode secrets set SLACK_TOKEN xoxb-your-token-here
dicode secrets list
dicode secrets delete SLACK_TOKEN
```

Secrets can also be managed from the web UI under the **Secrets** tab.

## Environment variable fallback

The `env` provider reads host environment variables. Useful for CI/CD and quick testing.
```

- [ ] **Step 6: Write sources.md**

Write `content/docs/concepts/sources.md`:

```markdown
# Sources & TaskSets

dicode discovers tasks through *sources* — directories of task files that are watched and reconciled automatically.

## Source types

### Local source

Watches a directory on disk using fsnotify. Changes are detected within ~100ms.

```yaml
sources:
  - type: local
    path: ~/dicode-tasks
    watch: true
```

### Git source

Clones and polls a git repository.

```yaml
sources:
  - type: git
    url: https://github.com/you/my-tasks
    branch: main
    poll_interval: 30s
    auth:
      type: token
      token_env: GITHUB_TOKEN
```

## TaskSets

Tasks are organized as **TaskSets** — hierarchical YAML manifests that compose task trees.

```yaml
# taskset.yaml
apiVersion: dicode/v1
kind: TaskSet
metadata:
  name: infra
spec:
  defaults:
    timeout: 30m
  entries:
    deploy-backend:
      ref:
        path: ./backend/task.yaml
    platform:
      ref:
        path: ./platform/taskset.yaml    # nested TaskSet
```

Tasks get namespace-scoped IDs: `infra/deploy-backend`, `infra/platform/nginx-start`.

### Override precedence

A 6-level stack flows defaults from root to leaf (leaf wins):
1. `task.yaml` base values
2. `kind:Config` defaults
3. `spec.defaults` in TaskSet
4. Parent overrides defaults
5. Parent entry-specific overrides
6. Local overrides

## Dev mode

Toggle dev mode to swap a git source to a local directory for instant iteration:

```
PATCH /api/sources/:name/dev
{ "enabled": true, "local_path": "~/my-tasks-dev" }
```

Or via MCP: `switch_dev_mode`.
```

- [ ] **Step 7: Write relay.md**

Write `content/docs/concepts/relay.md`:

```markdown
# Webhook Relay

The relay lets dicode instances behind NAT receive incoming webhooks without port forwarding or ngrok.

## How it works

The daemon maintains a persistent WebSocket connection to a relay server. Incoming HTTP requests are forwarded over the WebSocket, processed locally, and responses sent back.

```
GitHub/Slack/Stripe
       |
       | POST /u/<uuid>/hooks/my-task
       v
  Relay Server (relay.dicode.app)
       |
       | WebSocket
       v
  Local dicode daemon
```

## Setup

```yaml
# dicode.yaml
relay:
  enabled: true
  server_url: wss://relay.dicode.app
```

On first start, the daemon generates an ECDSA P-256 keypair. The UUID is derived from the public key — it never changes as long as the database is preserved.

Your webhook URL:
```
https://relay.dicode.app/u/<uuid>/hooks/<webhook-path>
```

## What works through the relay

- Webhook task execution (`/hooks/*`)
- Webhook task UIs (HTML, CSS, JS assets)
- `dicode.js` SDK serving

## Security

- ECDSA P-256 challenge-response authentication (no passwords)
- Path whitelist: only `/hooks/*` and `/dicode.js` forwarded
- Hop-by-hop headers stripped
- `X-Relay-Base` header injection for relay-aware UI serving
- 5 MB body limit, 25s local request timeout
- Auto-reconnect with exponential backoff

## Self-hosted relay

For environments where you control the infrastructure:

- **Go relay server** (`pkg/relay/server.go`) — lightweight, same binary
- **Node.js relay server** ([dicode-relay](https://github.com/dicode-ayo/dicode-relay)) — production-grade with OAuth broker
```

- [ ] **Step 8: Build and verify**

```bash
cd /workspaces/dicode-site/content
npx vitepress build docs
```

Expected: Build succeeds. All 10 pages render. Sidebar navigation works. Search indexes all content. "On this page" right sidebar shows H2/H3 headings.

- [ ] **Step 9: Commit**

```bash
git add content/docs/concepts/
git commit -m "docs: add concept guides (tasks, runtimes, triggers, SDK, secrets, sources, relay)"
```

---

### Task 4: Write Examples docs

**Files:**
- Create: `content/docs/examples/cron-task.md`
- Create: `content/docs/examples/webhook-task.md`
- Create: `content/docs/examples/docker-task.md`

- [ ] **Step 1: Write cron task example**

Write `content/docs/examples/cron-task.md`:

```markdown
# Example: Cron Task (TypeScript)

A task that checks GitHub PRs every weekday morning and posts a digest to Slack.

## task.yaml

```yaml
apiVersion: dicode/v1
kind: Task
name: GitHub PR Digest
description: Post open PRs to Slack every weekday morning
runtime: deno

trigger:
  cron: "0 9 * * 1-5"

params:
  slack_channel:
    default: "#dev"

permissions:
  env:
    - GITHUB_TOKEN
    - SLACK_WEBHOOK_URL
```

## task.ts

```typescript
const token = Deno.env.get("GITHUB_TOKEN")!;
const repo = await params.get("repo") ?? "dicode-ayo/dicode-core";
const channel = await params.get("slack_channel") ?? "#dev";

// Fetch open PRs
const res = await fetch(`https://api.github.com/repos/${repo}/pulls?state=open`, {
  headers: { Authorization: `Bearer ${token}` },
});
const prs = await res.json();

// Check against last known count
const lastCount = (await kv.get("pr_count") as number) ?? 0;

if (prs.length !== lastCount) {
  const lines = prs.map((pr: { title: string; number: number }) =>
    `#${pr.number}: ${pr.title}`
  );

  await fetch(Deno.env.get("SLACK_WEBHOOK_URL")!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `*${prs.length} open PRs in ${repo}:*\n${lines.join("\n")}`,
    }),
  });

  await kv.set("pr_count", prs.length);
  console.log("digest sent", { count: prs.length });
} else {
  console.log("no change", { count: prs.length });
}

return { prCount: prs.length, changed: prs.length !== lastCount };
```

## Key patterns

- **`Deno.env.get()`** for secrets declared in `permissions.env`
- **`await params.get()`** for task parameters with defaults
- **`await kv.get/set()`** for persistent state across runs
- **`fetch()`** for HTTP — native Deno, no special global
- **`return { ... }`** for structured output passed to chain triggers
```

- [ ] **Step 2: Write webhook task example**

Write `content/docs/examples/webhook-task.md`:

```markdown
# Example: Webhook with HTML UI

A webhook task that serves a custom HTML form and processes submissions.

## Directory structure

```
webhook-form/
├── task.yaml
├── task.ts
├── index.html
└── style.css
```

## task.yaml

```yaml
apiVersion: dicode/v1
kind: Task
name: Feedback Form
description: Collect feedback via a web form
runtime: deno

trigger:
  webhook: /hooks/feedback
  auth: true                 # require dicode session
```

## index.html

When the task directory contains `index.html`, dicode serves it on GET requests. The `dicode.js` SDK is auto-injected.

```html
<!DOCTYPE html>
<html>
<head>
  <title>Feedback</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Submit Feedback</h1>
  <form data-dicode>
    <textarea name="message" placeholder="Your feedback..."></textarea>
    <button type="submit">Send</button>
  </form>
</body>
</html>
```

The `data-dicode` attribute on the form auto-enhances it with the SDK: form submissions run the task, and logs stream in real-time.

## task.ts

```typescript
const message = input?.message;
if (!message) {
  return { error: "No message provided" };
}

console.log("received feedback:", message);
await kv.set(`feedback:${Date.now()}`, message);

await output.html(`<h2>Thank you!</h2><p>Your feedback has been recorded.</p>`);
return { status: "ok" };
```

## How it works

1. Browser GETs `/hooks/feedback` → dicode serves `index.html` with SDK injection
2. User submits the form → SDK POSTs to `/hooks/feedback`
3. dicode runs `task.ts` with form data as `input`
4. Task processes the data and returns a result
5. SDK streams logs and shows the response in the browser
```

- [ ] **Step 3: Write Docker task example**

Write `content/docs/examples/docker-task.md`:

```markdown
# Example: Docker Container Task

Run any language in a Docker container with live log streaming.

## task.yaml

```yaml
apiVersion: dicode/v1
kind: Task
name: Nginx Dev Server
description: Serve static files on port 8888
runtime: docker

trigger:
  daemon: true
  restart: always

docker:
  image: nginx:alpine
  pull_policy: missing
  ports:
    - "8888:80"
  volumes:
    - "/tmp/site:/usr/share/nginx/html:ro"
```

## How it works

- The `daemon` trigger starts the container on daemon boot
- `restart: always` restarts the container if it exits
- Live logs are streamed to the web UI
- You can kill the container from the UI or CLI
- On startup, dicode cleans up orphaned containers from previous runs

## Custom Dockerfile

Build an image from a Dockerfile in the task directory:

```yaml
runtime: docker
docker:
  build:
    context: .
    dockerfile: Dockerfile
  ports:
    - "3000:3000"
```

```dockerfile
# Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

## Podman alternative

Replace `runtime: docker` with `runtime: podman` for rootless containers. Same `docker:` config block.
```

- [ ] **Step 4: Build and verify**

```bash
cd /workspaces/dicode-site/content
npx vitepress build docs
```

Expected: 13 total pages. All examples render with syntax-highlighted code blocks. VitePress code groups (`::: code-group`) render as tabs.

- [ ] **Step 5: Commit**

```bash
git add content/docs/examples/
git commit -m "docs: add example guides (cron, webhook UI, docker)"
```

---

### Task 5: Update landing page and add Docs link

**Files:**
- Modify: `docs/index.html`

- [ ] **Step 1: Add Docs link to nav**

In `docs/index.html`, find the nav links section and add a Docs link:

```html
<!-- Find this line: -->
<li><a href="#features">Features</a></li>

<!-- Add before it: -->
<li><a href="/docs/">Docs</a></li>
```

- [ ] **Step 2: Fix the Runtimes section**

Replace the two-card runtimes section with four runtimes:

Find the `<section id="runtimes">` block and replace the `runtime-grid` content with four cards:
- **Deno (TypeScript)** — auto-installed, npm imports, native fetch, SDK globals
- **Python (uv)** — auto-installed, PEP 723 inline deps, async detection
- **Docker** — any language, live logs, kill support, orphan cleanup
- **Podman** — rootless alternative, same config

- [ ] **Step 3: Fix the Demo code example**

Replace `tasks/github-digest.js` with `tasks/github-digest.ts` and update the code to use actual Deno APIs (`fetch`, `Deno.env.get()`, `await kv.get/set()`) instead of the old goja globals (`http.get`, `env()`, `kv.get/set` sync).

- [ ] **Step 4: Fix the Globals section**

Replace the 9-item globals grid. Remove `http`, `webhook`, `notify` (don't exist in SDKs). Add `output`. Update `env` description to mention `Deno.env.get()`. Update `dicode` description to list actual methods (`run_task`, `list_tasks`, `get_runs`, `get_config`).

- [ ] **Step 5: Fix the Demo text**

Replace "a rich JavaScript API" and "sandboxed JavaScript runtime powered by goja" with accurate text about Deno/Python SDKs with native HTTP.

- [ ] **Step 6: Commit**

```bash
git add docs/index.html
git commit -m "fix: update landing page — add Docs link, fix runtimes, fix SDK globals"
```

---

### Task 6: Update CI workflow for VitePress build

**Files:**
- Modify: `.github/workflows/pages.yml`

- [ ] **Step 1: Update the workflow**

Replace `.github/workflows/pages.yml`:

```yaml
name: Deploy Site + Docs

on:
  push:
    branches: [main]
    paths:
      - "docs/**"
      - "content/**"
      - ".github/workflows/pages.yml"
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: content/package-lock.json

      - name: Install dependencies
        working-directory: content
        run: npm ci

      - name: Build VitePress docs
        working-directory: content
        run: npx vitepress build docs

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

The key change: VitePress builds `content/docs/` → `docs/docs/` before the upload step. The landing page at `docs/index.html` is untouched.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/pages.yml
git commit -m "ci: add VitePress build step to pages deployment"
```

---

### Task 7: Final build, test, and push

- [ ] **Step 1: Full build**

```bash
cd /workspaces/dicode-site/content
npm ci
npx vitepress build docs
```

Expected: Build succeeds. `docs/docs/` directory contains the generated site.

- [ ] **Step 2: Verify landing page still works**

Open `docs/index.html` in a browser. Verify:
- Landing page renders correctly
- "Docs" link in nav points to `/docs/`
- Runtimes show 4 options
- Demo code uses Deno syntax
- Globals section is accurate

- [ ] **Step 3: Verify docs site**

Open `docs/docs/index.html` in a browser. Verify:
- Docs landing page renders with hero
- Left sidebar shows all sections
- Right sidebar shows "On this page" TOC
- Search works (type a keyword)
- Dark theme is active by default
- All 13 pages load correctly
- Code groups show Deno/Python tabs

- [ ] **Step 4: Push and create PR**

```bash
git push origin main
```

Or if on a feature branch:

```bash
git push -u origin feat/docs-site
gh pr create --title "feat: add VitePress docs site" --body "..."
```
