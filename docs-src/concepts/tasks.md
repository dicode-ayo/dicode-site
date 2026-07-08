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
  replay_protection: false       # nonce-cache replay guard (default true when secret set)
  auth: true                     # require dicode session — see /concepts/triggers#session-authentication
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
  env_read_exposed: false        # Deno only: set true to grant bare --allow-env (off by default)
  env:
    - HOME                       # allowlist host env var
    - "GITHUB_*"                 # pattern: forwards + grants read for every matching host env var
    - name: API_KEY              # rename from host env
      from: GH_TOKEN
    - name: DB_PASS              # inject from secrets store
      secret: db_password
    - name: LOG_LEVEL            # literal value
      value: info
    - name: OAUTH_KEY            # inject from store, run a prereq task if absent
      secret: OAUTH_KEY
      if_missing:
        task: auth/some-oauth    # see Secrets page for details
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
    secrets_write: true          # dicode.secrets_set() / secrets_delete()
    audit_query: true            # dicode.audit.query() — sensitive; see SDK Globals

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
mcp_exposed: true                # visible to MCP clients via list_tasks / tools/call
mcp_port: 3000                   # daemon exposes MCP server on this port
on_failure_chain: buildin/alert  # short form — task to run on failure
# or the structured form:
# on_failure_chain:
#   task: buildin/auto-fix
#   params: { mode: review }
#   cooldown: 10m
#   max_concurrent: 1
#   max_depth: 2
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
| `enabled` | boolean | no | Default `true`. Disabled tasks remain visible in API/UI but are not scheduled, spawned, or routed. Toggle from the dashboard or via [`PATCH /api/tasks/{id}/overrides`](#enable-disable). |
| `params` | map | no | User-configurable input parameters |
| `permissions` | object | no | Security sandbox declarations |
| `docker` | object | conditional | Required when runtime is `docker` or `podman` |
| `timeout` | duration | no | Max execution time (default `60s` for scripts) |
| `mcp_exposed` | bool | no | Default `false`. When `true`, the task is visible to MCP clients via `list_tasks` and can be invoked via `tools/call`. When `false` (default), the task is hidden from MCP. See [MCP Server](./mcp-server.md). |
| `mcp_port` | int | no | Port where a daemon task exposes an MCP server |
| `on_failure_chain` | string \| object | no | Task ID (short form) or structured block to trigger on failure. Used for notifications, auto-fix, and any other side-effect chain. See [Auto-fix loop](./auto-fix.md). |

### Trigger types

Exactly one trigger type must be configured per task.

| Trigger | Field | Description |
|---------|-------|-------------|
| **Cron** | `cron: "0 9 * * *"` | Standard 5-field cron expression |
| **Webhook** | `webhook: /hooks/path` | HTTP endpoint |
| **Manual** | `manual: true` | CLI or UI only |
| **Chain** | `chain: { from: task-id, on: success }` | Fires after another task completes |
| **Daemon** | `daemon: true` | Long-running process, started with the service |

To run an ordered sequence of stages before a daemon or body — render a config, persist it, then start the daemon — use a **`kind: PipelineTask`** instead of a trigger field. See [Pipelines](./pipelines.md).

### Enable / disable

Every task has an `enabled` flag (default `true`). Disabled tasks remain visible in the API and the registry but are **not** scheduled, **not** spawned (daemons), and **not** routed (webhooks).

You can toggle it three ways:

1. **Dashboard** — click the circle/slash icon at the right of any row in the task list. Disabled tasks render faded with a "paused" badge.
2. **Statically in YAML** — set `enabled: false` on a `task.yaml`, or use the entry-level shortcut inside a `taskset.yaml` / `dicode.yaml`. See [Sources & TaskSets — Disabling an entry](./sources#disabling-an-entry) for parent-override semantics.
3. **REST API** — `PATCH /api/tasks/{id}/overrides`.

#### `PATCH /api/tasks/{id}/overrides`

Generic JSON Merge Patch (RFC 7396) endpoint that **persists** overrides to `dicode.yaml`'s `spec.entries.<source>.overrides.entries.<task>` block on disk — the change survives daemon restarts and is what the dashboard's enable/disable toggle calls under the hood. Today's clients only set `enabled`; the endpoint accepts every `taskset.Overrides` field, so future param/timeout UIs reuse it without backend changes.

The route is gated by `requireAuth` (session cookie only — API keys are not accepted here). The wizard generates configs with `server.auth: true`, so a bare `curl` against a wizard-bootstrapped install will be redirected to the login page. Copy the `dicode_secrets_sess` cookie from your browser's devtools and pass it on the request:

```sh
# Disable a task
curl -X PATCH http://localhost:8080/api/tasks/buildin/relay-client/overrides \
  -H 'Content-Type: application/json' \
  -b "dicode_secrets_sess=<paste-from-browser>" \
  -d '{"enabled": false}'

# Re-enable (clear the override entirely)
curl -X PATCH http://localhost:8080/api/tasks/buildin/relay-client/overrides \
  -H 'Content-Type: application/json' \
  -b "dicode_secrets_sess=<paste-from-browser>" \
  -d '{"enabled": null}'
```

Setting a field to `null` removes it from the merge patch (per RFC 7396), reverting that field to the underlying TaskSet/`task.yaml` value.

| Status | Meaning |
|---|---|
| `200` | Override applied; reconciler picks up the change within ~1s |
| `400` | Malformed JSON, unknown override field, or invalid task ID suffix |
| `404` | Task ID not found in the registry |
| `409` | Stale write — `dicode.yaml` was modified since you last read it (mtime-based optimistic concurrency); re-read and retry |
| `422` | Cannot enable a task whose ancestor source is disabled — clear the ancestor override first |

The toggle propagates within ~1 second: the source manager triggers an out-of-band reconcile rather than waiting up to 30 s for the next poll tick.

### Docker runtime config

Required when `runtime` is `docker` or `podman`. Must specify either `image` or `build`.

| Field | Description |
|-------|-------------|
| `image` | Docker image to pull (e.g. `nginx:alpine`) |
| `build.dockerfile` | Path to Dockerfile, relative to task dir. Supports `${VAR}` expansion. |
| `build.context` | Build context directory, relative to task dir. Supports `${VAR}` expansion. |
| `command` | Override image CMD. Supports `${VAR}` expansion. |
| `entrypoint` | Override image ENTRYPOINT. Supports `${VAR}` expansion. |
| `volumes` | Bind mounts in `host:container[:ro]` format. Supports `${VAR}` expansion. |
| `ports` | Port mappings in `hostPort:containerPort` format |
| `working_dir` | Container working directory. Supports `${VAR}` expansion. |
| `env_vars` | Extra environment variables (literal values) |
| `pull_policy` | `always`, `missing` (default), or `never` |

::: warning Container security floor
By default, dicode rejects Docker and Podman task configurations that use host networking, dangerous Linux capabilities, insecure `security_opt` values, or bind mounts to sensitive system paths. Tasks with such configuration will fail at start time with a descriptive error.

To opt in to a specific exception, add a `container_security:` block to `dicode.yaml` — see [Container Security](/getting-started/configuration#container-security). Named and anonymous volumes (not host bind-mounts) are always allowed.
:::

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
For Deno tasks, `permissions.net`, `permissions.fs`, `permissions.run`, and `permissions.sys` map directly to Deno's `--allow-*` flags. Python tasks enforce only `permissions.env`. Docker and Podman tasks enforce `permissions.env` (env injection) and `permissions.net` (network isolation — see the `net` row below); the fs/run/sys fields are not yet enforced for container runtimes.
:::

### Permissions field reference

| Field | Type | Description |
|-------|------|-------------|
| `env` | list | Env vars the task may read; each entry is a bare name, a trailing-`*` prefix **pattern** (e.g. `"GITHUB_*"`), a `from:` rename, `secret:` injection, or literal `value:`. See [Secrets](./secrets.md) and "Pattern entries" below. |
| `env_read_exposed` | bool | **Deno only.** Grant bare `--allow-env` (read any env var). Default `false`. See below. |
| `fs` | list | **Deno (read + write); Python (write mode only).** Filesystem paths and access modes (`r`, `w`, `rw`). See write-protection note below. |
| `run` | list | Executables the script may spawn (`Deno.Command` / Python `subprocess`). Use `["*"]` for all; omit to deny all. |
| `net` | list | Outbound network hostnames. Use `["*"]` for unrestricted; omit or use `[]` to deny all. **Docker/Podman**: empty list → container starts with `network_mode: none`; specific hosts are informational only today (per-host filtering not yet implemented; a warning is logged). |
| `sys` | list | **Deno only.** System-info APIs (`hostname`, `osRelease`, …). |
| `dicode` | object | dicode runtime API access (`tasks`, `mcp`, `list_tasks`, `get_runs`, `secrets_write`). |

::: warning Write-protected daemon files
`dicode.lock` and `dicode.yaml` are unconditionally write-protected for all tasks, regardless of declared `permissions.fs` grants. A task with `permissions.fs: [{path: /home/user/.dicode, permission: w}]` covering the config directory will still receive `NotCapable` (Deno) or `PermissionError` (Python) when it tries to write or remove either file. This protection cannot be overridden via taskset `overrides:` — it is enforced by the runtime at the flag / audit-hook level to guard the approval-gate state.
:::

### `env_read_exposed` — grant unrestricted env read (Deno / npm escape hatch)

`permissions.env_read_exposed: true` grants the Deno subprocess bare `--allow-env`, allowing it to read **any** env var. It exists for tasks that import npm packages via `npm:` specifiers: transitive dependencies often read `process.env` keys (such as `NODE_ENV`) at module-init time, before `main()` runs. Because that set of keys is unpredictable per dependency, listing individual names in `env:` is fragile — the import will still throw `NotCapable` for any key not declared.

`env_read_exposed` widens *read permission* only and is independent of the `env:` list. Named `env:` entries already grant per-variable read permission (they appear in `--allow-env=FOO,BAR,...`) and inject values into the subprocess env. The flag is needed only when a transitive dependency reads env vars that are **not** declared in `env:`. Keep named/`secret:`/`from:` entries for variables the task explicitly declares; add the flag only if npm-compat imports still fail:

```yaml
permissions:
  env_read_exposed: true   # allow reading any env var (node-compat import needs this)
  env:
    - DICODE_DATADIR        # still forwarded so the script's value is populated
    - DICODE_VERSION
```

**Why this is safe.** A task subprocess does not inherit the full daemon environment. The subprocess env is assembled as an allowlist: process basics, cache/proxy/TLS vars, the per-run IPC coordinates (`DICODE_SOCKET`/`DICODE_TOKEN`), host values of the task's own named `env:` entries, and resolved secrets. The daemon master key and admin/MCP API keys are explicitly denylisted and never forwarded. Bare `--allow-env` therefore exposes only the already-task-scoped env — nothing the task did not already hold.

**Constraints:**

- Only settable in the task's own `task.yaml`. Taskset `overrides:` blocks cannot set `env_read_exposed`.
- Toggling the flag changes the task's content hash, which re-pends the task at the approval gate.
- Deno only. Python tasks read env through the SDK (`env.get()`), which is not gated by `--allow-env`; this flag is silently ignored on Python, Docker, and Podman runtimes.

::: warning Validation error for `env: ["*"]`
A bare `"*"` entry in the `env:` list (no prefix) is a **validation error**. Use `env_read_exposed: true` instead. A *prefixed* pattern like `"GITHUB_*"` is a different, newly-accepted form -- see below.
:::

### permissions.env pattern entries: forward a family of host vars

A bare `env:` entry ending in `*` (e.g. `"GITHUB_*"`) is a **pattern**, not a literal name. At launch, dicode expands it against the host environment and forwards every matching variable's value into the task subprocess, granting read access to each matched name -- without needing `env_read_exposed: true` or enumerating every variable individually:

```yaml
permissions:
  env:
    - "GITHUB_*"      # pattern: forwards + grants read for every matching host env var
```

This matches `GITHUB_TOKEN`, `GITHUB_SHA`, `GITHUB_REPOSITORY`, and any other host var sharing the `GITHUB_` prefix -- the task never has to name each one.

**Matching semantics:**

- Matching is a **trailing-`*` prefix glob only** (e.g. `GITHUB_*` matches names starting with `GITHUB_`) -- not shell globbing and not regex.
- A pattern is only recognized when the entry has no `from:`, `secret:`, or `value:` key — a plain string (`- "GITHUB_*"`) and an equivalent `- name: "GITHUB_*"` mapping with no other keys are both recognized as patterns. An entry carrying `from:`, `secret:`, or `value:` keeps its literal name and is never treated as a pattern, even if that name ends in `*`.
- A lone `"*"` (no prefix) is still rejected at validation -- see the warning above. Use `env_read_exposed: true` for unrestricted read access instead.

**Security exclusion.** A pattern can never forward a daemon credential or the per-run IPC coordinates, even if the pattern would otherwise match them: `DICODE_MASTER_KEY`, `DICODE_API_KEY`, `DICODE_MCP_API_KEY`, `DICODE_SOCKET`, and `DICODE_TOKEN` are always excluded from pattern expansion. For example, a task declaring `"DICODE_*"` forwards none of those five -- only other host vars sharing the `DICODE_` prefix, if any.

**Not the same as `env_read_exposed`.** These two knobs solve different problems and are not interchangeable:

- A **pattern** entry (`"GITHUB_*"`) narrows *which contents* are forwarded into the subprocess env and made readable, scoped to a matched name family. It's a least-privilege lever: pull in a related group of vars without enumerating each one.
- **`env_read_exposed: true`** widens *read permission* over the already-curated subprocess env — it grants bare `--allow-env` so the script can read any var already present in that env, but does not by itself forward anything new. See "`env_read_exposed` -- grant unrestricted env read" above for the exact per-runtime scope.

Both the Deno and Python runtimes consume the same expansion for forwarding and for granting read access (Deno `--allow-env`; the Python env-read guardrail), so the set of vars a pattern forwards is always exactly the set it makes readable. Pattern entries apply to Deno and Python only: Docker and Podman tasks are not subprocess-based and do not consume pattern entries.

## Template variables

A tight allowlist of fields in `task.yaml` support `${VAR}` substitution, resolved at task-load time. Use them for paths and indirection keys that depend on where the task is loaded from.

**Supported fields:**

| Field | Notes |
| --- | --- |
| `permissions.fs[].path` | |
| `trigger.webhook_secret` | |
| `permissions.env[].from \| .secret \| .value` | |
| `docker.command` | `envFallback` off — see below |
| `docker.entrypoint` | `envFallback` off — see below |
| `docker.working_dir` | `envFallback` off — see below |
| `docker.build.context` | `envFallback` off — see below |
| `docker.build.dockerfile` | `envFallback` off — see below |
| `docker.volumes` | `envFallback` off — see below |

Everything else is taken literally.

**Built-in variables:**

| Variable | Value |
| --- | --- |
| `${TASK_DIR}` | Absolute path to this task's own directory |
| `${HOME}` | User home directory |
| `${SOURCE_ROOT}` | Absolute path to the source root (injected by the source loader) |
| `${SKILLS_DIR}` | Auto-derived as `${SOURCE_ROOT}/skills` |

Resolution order: built-ins → process env → **leave literal** (unknown `${VAR}` references stay in place so bugs surface loudly rather than silently collapsing to an empty string).

::: warning Docker fields: daemon env vars are not a fallback
For all `docker.*` fields listed above, `envFallback` is **off**: built-in variables (`${TASK_DIR}`, `${DATADIR}`, etc.) are expanded, but daemon process environment variables are **not** accessible as a fallback. An unrecognised `${VAR}` reference is left as-is rather than silently replaced with a daemon env var value.

This matches the existing behaviour of `docker.volumes` and is intentional — Docker tasks declare their env access via `permissions.env`, not through template substitution.
:::

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

**Example: use `${TASK_DIR}` in Docker fields to mount or reference files from the task directory:**

```yaml
docker:
  build:
    context: "${TASK_DIR}"
    dockerfile: "${TASK_DIR}/Dockerfile"
  working_dir: /app
  volumes:
    - "${TASK_DIR}/config:/app/config:ro"
  command: ["python", "main.py", "--data", "/data"]
```
