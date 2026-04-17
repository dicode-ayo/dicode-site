# Tasks

A **task** is the fundamental unit of work in dicode. Each task is a directory containing a `task.yaml` manifest and (for script-based runtimes) a script file. Tasks are the building blocks of all automation -- from cron jobs and webhooks to long-running daemons and chained workflows.

## Everything is a task

dicode is a **task kernel** — a minimal Go binary that handles scheduling, runtime execution, git reconciliation, and security boundaries. Everything above that layer is a task:

| Platform feature | How it's implemented | Can you replace it? |
|-----------------|---------------------|-------------------|
| **AI task generator** | Daemon task using OpenAI-compatible API | Yes — swap the model, provider, or the entire task |
| **Web dashboard** | Daemon task serving HTML on port 8080 | Yes — write your own UI as a daemon task |
| **AI chat agent** | Webhook task at `/hooks/ai` | Yes — customize skills, tools, provider |
| **Notification alerts** | Task triggered on failure via chain | Yes — write your own Telegram/email/PagerDuty notifier |
| **MCP server** | Daemon task speaking JSON-RPC 2.0 | Yes — write your own MCP server task with custom tool selection |

The defaults are sensible and work out of the box. But if you need different behavior — a different AI model, a custom dashboard, a different notification channel — you replace the task, not the binary. Everything is versioned in git, reviewable, and revertable.

## Directory structure

Every task lives in its own directory. The directory name becomes the task's ID.

```
my-task/
  task.yaml       # required: task manifest
  task.ts         # script file (Deno)
```

For Python tasks:

```
my-task/
  task.yaml
  task.py
```

For Docker tasks, the script file is optional -- the container image provides the executable:

```
my-task/
  task.yaml
  Dockerfile      # optional: build a custom image
```

Webhook tasks can include a UI:

```
my-task/
  task.yaml
  task.ts
  index.html      # served at the webhook path in a browser
  style.css       # static files are served alongside index.html
```

## task.yaml reference

The `task.yaml` file is the complete declaration of a task. Here is a full example showing all available fields:

```yaml
apiVersion: dicode/v1
kind: Task
name: My Task
description: A short description of what this task does.
runtime: deno            # deno | python | docker | podman
version: 1.0.0           # optional version string

trigger:
  # Exactly one trigger type is required:
  cron: "0 9 * * *"              # 5-field cron expression
  webhook: /hooks/my-task        # HTTP path
  webhook_secret: "${SECRET}"    # HMAC-SHA256 secret (env var interpolation)
  auth: true                     # require dicode session auth for webhook
  manual: true                   # only triggered explicitly
  daemon: true                   # long-running process
  restart: always                # daemon only: always | on-failure | never
  chain:                         # triggered by another task
    from: other-task
    on: success                  # success | failure | always

params:
  repo:
    description: GitHub repo in owner/name format
    type: string                 # string | number | boolean | cron
    default: "denoland/deno"
    required: true

permissions:
  env:
    - HOME                       # allowlist host env var
    - name: API_KEY              # rename from host env
      from: GH_TOKEN
    - name: DB_PASS              # inject from secrets store
      secret: db_password
    - name: LOG_LEVEL            # literal value
      value: info
  fs:                            # Deno only: filesystem access
    - path: /tmp
      permission: rw
  run:                           # Deno only: allowed executables
    - git
  net:                           # Deno only: network access
    - api.github.com             # specific hosts, or ["*"] for all
  sys:                           # Deno only: system info APIs
    - hostname
  dicode:                        # dicode runtime API permissions
    tasks: ["*"]                 # dicode.run_task() targets
    mcp: ["my-mcp-daemon"]       # mcp.list_tools() / mcp.call() targets
    list_tasks: true             # dicode.list_tasks()
    get_runs: true               # dicode.get_runs()
    get_config: true             # dicode.get_config()
    secrets_write: true          # dicode.secrets_set() / secrets_delete()

docker:                          # docker/podman runtime only
  image: nginx:alpine
  build:
    dockerfile: Dockerfile       # relative to task dir
    context: .                   # relative to task dir
  command: ["echo", "hello"]
  entrypoint: ["/bin/sh"]
  volumes:
    - /tmp:/data:ro
  ports:
    - 8080:80
  working_dir: /app
  env_vars:
    MY_VAR: value
  pull_policy: missing           # always | missing | never

timeout: 30s                     # default 60s for script tasks; no default for docker/daemon
mcp_port: 3000                   # daemon exposes MCP server on this port
on_failure_chain: alert-task     # task to run on failure (overrides global default)

notify:
  on_success: false
  on_failure: true
```

## Field reference

### Top-level fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apiVersion` | string | no | Always `dicode/v1` |
| `kind` | string | no | Always `Task` |
| `name` | string | yes | Human-readable task name |
| `description` | string | no | Short description |
| `runtime` | string | yes | `deno`, `python`, `docker`, or `podman` |
| `version` | string | no | Version string for the task |
| `trigger` | object | yes | How the task is triggered (see below) |
| `params` | map | no | User-configurable input parameters |
| `permissions` | object | no | Security sandbox declarations |
| `docker` | object | conditional | Required when runtime is `docker` or `podman` |
| `timeout` | duration | no | Max execution time (default `60s` for scripts) |
| `mcp_port` | int | no | Port where a daemon task exposes an MCP server |
| `on_failure_chain` | string | no | Task ID to trigger on failure |
| `notify` | object | no | Notification overrides |

### Trigger types

Exactly one trigger type must be configured per task.

| Trigger | Field | Description |
|---------|-------|-------------|
| **Cron** | `cron: "0 9 * * *"` | Standard 5-field cron expression |
| **Webhook** | `webhook: /hooks/path` | HTTP endpoint |
| **Manual** | `manual: true` | CLI or UI only |
| **Chain** | `chain: { from: task-id, on: success }` | Fires after another task completes |
| **Daemon** | `daemon: true` | Long-running process, started with the service |

### Docker runtime config

Required when `runtime` is `docker` or `podman`. Must specify either `image` or `build`.

| Field | Description |
|-------|-------------|
| `image` | Docker image to pull (e.g. `nginx:alpine`) |
| `build.dockerfile` | Path to Dockerfile, relative to task dir |
| `build.context` | Build context directory, relative to task dir |
| `command` | Override image CMD |
| `entrypoint` | Override image ENTRYPOINT |
| `volumes` | Bind mounts in `host:container[:ro]` format |
| `ports` | Port mappings in `hostPort:containerPort` format |
| `working_dir` | Container working directory |
| `env_vars` | Extra environment variables (literal values) |
| `pull_policy` | `always`, `missing` (default), or `never` |

## Return values

Tasks can return structured data that is stored with the run result and passed as `input` to chained tasks.

::: code-group

```ts [Deno (task.ts)]
export default async function main({ params, output }: DicodeSdk) {
  const name = await params.get("name");
  // Return a value by returning from main()
  return { greeting: `Hello, ${name}!`, timestamp: Date.now() };
}
```

```python [Python (task.py)]
name = params.get("name", "World")
# Return a value by assigning to `result`
result = {"greeting": f"Hello, {name}!", "source": "python"}
```

:::

For Python `async def main()` tasks, you can return directly:

```python
async def main():
    name = await params.get_async("name", "World")
    return {"greeting": f"Hello, {name}!"}
```

## Params

Parameters are declared in `task.yaml` and can be provided at runtime via CLI, API, webhook body, or chain input.

Two YAML formats are supported:

```yaml
# Concise map form
params:
  repo: "denoland/deno"
  limit:
    description: Max results
    default: "10"
    type: number
```

```yaml
# The same thing expanded
params:
  repo:
    default: "denoland/deno"
  limit:
    description: Max results
    default: "10"
    type: number
```

| Param field | Description |
|-------------|-------------|
| `description` | Shown in the UI and CLI help |
| `type` | `string` (default), `number`, `boolean`, or `cron` |
| `default` | Default value if not provided |
| `required` | If `true`, the task fails when the param is missing |

## Permissions

The `permissions` block declares what the task is allowed to access. Nothing is implicitly available -- every environment variable, filesystem path, network host, and dicode API must be explicitly listed.

See [Secrets](./secrets.md) for details on `permissions.env` and secret injection.

::: tip
For Deno tasks, permissions map directly to Deno's `--allow-*` flags. Python and Docker tasks use env injection only (`permissions.env`).
:::

## Template variables

A tight allowlist of fields in `task.yaml` support `${VAR}` substitution, resolved at task-load time. Use them for paths and indirection keys that depend on where the task is loaded from.

**Supported fields:** `permissions.fs[].path`, `trigger.webhook_secret`, and `permissions.env[].from | .secret | .value`. Everything else is taken literally.

**Built-in variables:**

| Variable | Value |
| --- | --- |
| `${TASK_DIR}` | Absolute path to this task's own directory |
| `${HOME}` | User home directory |
| `${SOURCE_ROOT}` | Absolute path to the source root (injected by the source loader) |
| `${SKILLS_DIR}` | Auto-derived as `${SOURCE_ROOT}/skills` |

Resolution order: built-ins → process env → **leave literal** (unknown `${VAR}` references stay in place so bugs surface loudly rather than silently collapsing to an empty string).

**Example: reference the shared skills directory regardless of source type:**

```yaml
permissions:
  fs:
    - path: "${SKILLS_DIR}"
      permission: r
```

**Example: reference a webhook secret from the process environment:**

```yaml
trigger:
  webhook: /hooks/github
  webhook_secret: "${GITHUB_WEBHOOK_SECRET}"
permissions:
  env:
    - GITHUB_WEBHOOK_SECRET
```
