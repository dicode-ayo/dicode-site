# Triggers

Every task has exactly one trigger type that determines how it is started. Triggers are declared in the `trigger:` block of `task.yaml`.

## Cron

Runs the task on a schedule using standard 5-field cron expressions.

```yaml
trigger:
  cron: "0 9 * * *"     # every day at 9:00 AM
```

```yaml
trigger:
  cron: "*/5 * * * *"   # every 5 minutes
```

```yaml
trigger:
  cron: "0 0 * * 1"     # every Monday at midnight
```

The five fields are: `minute hour day-of-month month day-of-week`.

### Missed-run catchup

If dicode was stopped when a cron task was due to fire, it runs the missed execution on startup (once, not all missed intervals). This ensures scheduled tasks do not silently skip runs during downtime.

---

## Webhook

Exposes an HTTP endpoint that triggers the task when it receives a request.

```yaml
trigger:
  webhook: /hooks/my-task
```

The webhook path must start with `/hooks/`. When a request arrives at this path, the request body is parsed and made available as the `input` global in the task script.

### HMAC authentication

Protect webhooks with HMAC-SHA256 signature verification. This is the standard mechanism used by GitHub, Stripe, and other services.

```yaml
trigger:
  webhook: /hooks/github-push
  webhook_secret: "${GITHUB_WEBHOOK_SECRET}"
```

When `webhook_secret` is set, dicode verifies the `X-Hub-Signature-256` header on every incoming request. Requests without a valid signature are rejected with `403` before the task script runs.

The secret value supports `${ENV_VAR}` interpolation -- the actual secret is read from the secrets store or environment at runtime.

::: tip
You never need to verify the HMAC signature in your task script. dicode handles this automatically when `webhook_secret` is configured.
:::

### Replay protection

When `webhook_secret` is set, dicode automatically rejects duplicate webhook bodies within a 1-hour window. This prevents replay attacks -- the task fires once and subsequent identical requests return HTTP 409 Conflict.

The nonce cache is keyed on the HMAC digest (already computed during signature verification), bounded to 10,000 entries, and kept in memory. It works for both `kind: Task` and `kind: PipelineTask` webhooks.

Replay protection is enabled by default. Opt out per task if your sender legitimately sends byte-identical payloads:

```yaml
trigger:
  webhook: /hooks/idempotent-task
  webhook_secret: "${SECRET}"
  replay_protection: false
```

Open webhooks (no `webhook_secret`) are unaffected -- replay protection only applies when signature verification is active.

### Session authentication

For webhooks that should only be accessible to authenticated dicode users (not external services):

```yaml
trigger:
  webhook: /hooks/dashboard
  auth: true
```

When `auth: true` is set, both GET (UI) and POST (run) requests require a valid dicode session. Any webhook task can opt in — for example, the built-in dashboard at `/hooks/webui` and the `dicodai` preset at `/hooks/ai/dicodai` both ship with `auth: true` because they're only ever called from within an authenticated dicode session.

`auth` is tri-valued:

- `true` / `"session"` — a valid dicode session is required, as described above. If `webhook_secret` is also set, a session **and** a valid HMAC signature are both required.
- `"any"` — a valid session **or** a valid HMAC signature authenticates the request. See [Session or HMAC (`auth: any`)](#session-or-hmac-auth-any) below.
- absent / `false` — public, no change in behavior.

#### Login flow

Unauthenticated browser GETs to a protected webhook path are redirected with `303 See Other` to `/login?next=<original-path>`:

```
GET /hooks/dashboard
  ↓ 303
/login?next=%2Fhooks%2Fdashboard
  ↓ user enters passphrase, form POSTs to /api/auth/login
  ↓ 303 (session cookie set)
/hooks/dashboard          ← original target
```

The login page resolves the task's `name` and `description` from the registry when `next=/hooks/<id>` is a known webhook, so users see *which* task they're signing in to access (e.g. "Sign in to access AI Agent") rather than a generic prompt.

**API clients** (requests without `Accept: text/html`) receive `401 JSON` instead of a redirect, preserving machine-readable behaviour for curl, fetch, and SDK callers.

#### Session or HMAC (`auth: any`)

`auth: true`/`"session"` requires a session no matter how the request arrives, which — as the [Relay behavior](#relay-behavior) below explains — makes those webhooks unreachable through the relay entirely. `auth: any` relaxes that for tasks that also need to accept a **signed machine caller** over the public relay URL, since session cookies never traverse the relay:

```yaml
trigger:
  webhook: /hooks/my-machine-endpoint
  auth: any
  webhook_secret: "${MY_WEBHOOK_SECRET}"
```

- **`POST`** — authenticates with **either** a valid dicode session **or** a valid HMAC signature (per [HMAC authentication](#hmac-authentication) above). A browser with a session works directly against the daemon; a machine caller that only has the shared secret can sign its request and reach the same endpoint over the relay.
- **`GET`** and static asset requests always require a session — never a signature. This mirrors `auth: true`'s login flow and keeps the task's UI itself session-gated even when its POST endpoint accepts signed callers.
- `webhook_secret` is **required** for `auth: any` — a task with `auth: any` and no `webhook_secret` fails to load with a validation error, since the HMAC path would otherwise have nothing to verify against.

Because a relayed request is never evaluated for a session (see [Relay behavior](#relay-behavior) below), the practical effect is: a browser authenticates directly against the daemon via its session, while a signed machine caller authenticates over the relay via HMAC. Neither path lets an unsigned, session-less caller through.

#### Relay behavior

The login flow above only applies to the **direct** path (hitting the daemon at its own address). Reached through the [webhook relay](./relay.md) instead, a request is never evaluated for a session at all: the daemon detects the relay hop via the trusted `X-Relay-Base` header (set by the relay client itself; any copy on an inbound request is stripped) and skips straight to the HMAC check (if any) — a session, even a valid one, cannot be presented over the relay in the first place, since session cookies are stripped before the request reaches the daemon.

`GET` requests -- and the task's UI/static assets -- always require a session no matter which auth value is set, so they behave identically here for both `auth: true` and `auth: any`:

```
GET https://relay.dicode.app/u/<uuid>/hooks/dashboard
  ↓ X-Relay-Base present → session check skipped
  ↓ 401
HTML explainer (browser)  |  JSON error (API client)
```

- Browser GETs (`Accept: text/html`) receive a `401` with a small HTML explainer page -- it points at the daemon's own address, or a tunnel such as Tailscale or cloudflared, for interactive access.
- API callers receive `401 JSON`, the same machine-readable shape as the direct-path rejection above.

For `auth: true`/`"session"` **`POST`** requests, this is the end of the story: session is the only credential the option accepts, and there's no HMAC fallback, so the request is rejected outright the same as the `GET` case above -- an `auth: true`/`"session"` webhook is unreachable through the relay, full stop.

`auth: any` **`POST`** requests are different: since the option accepts a session **or** a signature, and only the HMAC check is reachable over the relay, a request carrying a valid `X-Hub-Signature-256` (and, optionally, `X-Dicode-Timestamp`) succeeds exactly as it would against the daemon directly:

```
POST https://relay.dicode.app/u/<uuid>/hooks/my-machine-endpoint
  ↓ X-Relay-Base present → session check skipped, HMAC checked instead
  ↓ valid signature → task runs, 200
  ↓ missing/invalid signature → 403
```

This is why `auth: any` exists: it is the one auth mode that is both session-gated for browsers and reachable by a signed machine caller through the relay.

This is by design, not a bug: the relay only forwards `/hooks/*` and `/dicode.js` (see [Path whitelist](./relay.md#path-whitelist)) and strips every credential header on the way in, so a session cookie minted by `/login` could never reach the daemon -- `/login` itself falls outside the relay's path whitelist and is rejected with `403` before any login form can load or POST. Rejecting the session path outright (with a clear `401` explainer, or a fallback to the HMAC check for `auth: any`) avoids that dead end.

If you need interactive remote access to a session-gated page like the dashboard, use a tunnel (Tailscale, cloudflared, etc.) that reaches the daemon directly instead of routing through the relay.

::: tip
`auth: true`/`"session"` webhooks are unreachable through the relay on every method. `auth: any` webhooks are reachable over the relay for signed `POST` requests, but their `GET`/asset requests are gated exactly like `auth: true` and stay unreachable there too. Plain HMAC-authenticated (`webhook_secret` with no `auth`) and open webhooks work through the relay exactly as described in [What works through the relay](./relay.md#what-works-through-the-relay).
:::

#### Safety

The `next` parameter is validated as a same-origin path. Values that don't start with `/`, contain protocol-relative prefixes (`//`, `/\`), include backslashes or CR/LF, or parse to anything with a scheme/host/opaque component are rejected. Unsafe values fall back to `/hooks/webui` (form POST) or are dropped from the response (JSON POST). Open-redirect abuse attempts like `?next=//evil.com`, `?next=https://evil.com`, or `?next=javascript:…` cannot escape the same origin.

#### Setting up the passphrase

See [Auth passphrase](/getting-started/configuration#auth-passphrase) in the configuration guide for how the passphrase is generated on first boot, where it's stored, and how to rotate or recover it.

### Webhook task UIs

Webhook tasks can serve a custom HTML interface. Place an `index.html` file in the task directory:

```
my-task/
  task.yaml
  task.ts
  index.html      # served when the webhook path is opened in a browser
  style.css       # static assets are served alongside
```

When a user opens the webhook path in a browser, dicode serves `index.html` instead of running the task. The `dicode.js` client SDK is automatically injected into the page.

#### dicode.js client SDK

The injected `dicode.js` provides three complexity levels for building webhook UIs:

**Level 1 -- Zero JS:** A plain HTML form with `method="POST"` works out of the box. dicode parses the form body, runs the task, and redirects to the result page.

```html
<form method="POST">
  <input name="text" required />
  <button type="submit">Run</button>
</form>
```

**Level 2 -- Auto-enhanced forms:** Add `data-dicode` to any `<form>` to intercept submission with JavaScript. The task runs asynchronously and the response is rendered into the `data-output` target element.

```html
<form data-dicode data-output="#output">
  <input name="text" required />
  <button type="submit">Run</button>
</form>
<pre id="output"></pre>
```

**Level 3 -- Full API:** Use `dicode.execute()` for complete control over rendering and error handling.

```js
dicode.execute({ text: "hello" }, {
  onFinish(data) {
    // data.runId, data.status, data.contentType, data.body, data.returnValue
    document.getElementById("result").textContent = data.body;
  },
  onError(err) {
    console.error("Task failed:", err);
  }
});
```

---

## Manual

Tasks that should only run when explicitly triggered by a user.

```yaml
trigger:
  manual: true
```

Manual tasks are triggered via the CLI or the web UI:

```bash
dicode run my-task
dicode run my-task --param repo=denoland/deno
```

---

## Chain

Fires a task automatically when another task completes.

```yaml
trigger:
  chain:
    from: data-fetch        # task ID to listen for
    on: success             # success (default) | failure | always
```

### Conditions

| Value | Triggers when |
|-------|---------------|
| `success` | The upstream task completed successfully (default) |
| `failure` | The upstream task failed |
| `always` | The upstream task completed regardless of outcome |

### Input passing

The upstream task's return value is available as the `input` global in the chained task:

::: code-group

```ts [Deno]
export default async function main({ input }: DicodeSdk) {
  // input is whatever the upstream task returned
  const data = input as { count: number };
  console.log(`Upstream returned count: ${data.count}`);
}
```

```python [Python]
# input is available at module level
data = input
log.info(f"Upstream returned count: {data['count']}")
```

:::

### Chaining multiple tasks

Build pipelines by chaining tasks in sequence:

```yaml
# fetch-data/task.yaml
trigger:
  cron: "0 * * * *"
---
# process-data/task.yaml
trigger:
  chain:
    from: fetch-data
    on: success
---
# alert-on-failure/task.yaml
trigger:
  chain:
    from: process-data
    on: failure
```

### Chain constraints

#### Cycle detection

Success chains are validated for cycles at registration time. If registering a task would create a cycle (for example, task A chains from B, and B chains from A), the **new task is rejected** — its trigger is not armed and it will not fire. A warning is written to the daemon log identifying the cycle.

::: warning
To fix a cycle rejection: correct the chain in the offending `task.yaml` and push — the reconciler re-registers the task on the next sync (within ~30 seconds). The daemon does not need to restart.
:::

#### Depth cap

Success chains have a maximum depth of **10 hops** past the root trigger. The cap is enforced at runtime: once a chain is 10 hops deep, the engine stops firing further hops and writes a warning to the daemon log. Hops 1–10 execute normally; hop 11 and beyond are suppressed. Design pipelines that require more stages using explicit cron or manual triggers at intermediate steps.

::: tip
Failure chains have a configurable depth cap with a default of **2** (`on_failure_chain.max_depth` in `task.yaml`). Both caps prevent infinite loops caused by misconfigured chains.
:::

---

## Daemon

Long-running processes that start when dicode starts and optionally restart on exit.

```yaml
trigger:
  daemon: true
  restart: always          # always (default) | on-failure | never
```

### Restart policies

| Policy | Behavior |
|--------|----------|
| `always` | Restart the task whenever it exits (default) |
| `on-failure` | Restart only if the task exits with a non-zero status |
| `never` | Do not restart; the task runs once at startup |

### Crash backoff

When a daemon exits and is eligible for restart, dicode waits before re-launching it. The wait follows an exponential schedule to prevent CPU thrash from daemons that crash immediately on every boot:

| Restart attempt | Wait before re-launch |
|---|---|
| 1st | 1 second |
| 2nd | 2 seconds |
| 3rd | 4 seconds |
| 4th | 8 seconds |
| 5th | 16 seconds |
| 6th+ | 30 seconds (cap) |

The backoff resets if the daemon ran stably for **at least 10 seconds** before the crash — a healthy long-lived daemon that eventually exits is not penalised. A daemon that crashes immediately on every boot hits the 30-second cap (applied to what the doubling would otherwise make 32 seconds) by the sixth restart. This is intentional: the cap keeps the process alive and retrying without saturating the CPU.

Backoff state is per-daemon and in-memory — it resets when `dicode daemon` itself restarts.

### Shutdown signals

`dicode daemon` responds to **`SIGTERM`**, **`SIGINT`**, and **`SIGHUP`** with a graceful shutdown: in-flight runs are cancelled, logs are flushed, and the database is closed cleanly before the process exits.

::: tip Deployment notes
- **systemd** — the default `KillSignal` is `SIGTERM`, which works. No extra configuration needed.
- **supervisord** — `stopsignal=TERM` (the default) works. Note that `SIGHUP` also triggers a full graceful shutdown — if your supervisord setup sends `SIGHUP` to managed processes during a reload, dicode will shut down, not stay running.
- **Docker** — set `STOPSIGNAL SIGTERM` in your `Dockerfile` (already the default).
- **Kubernetes** — Kubernetes sends `SIGTERM` directly to PID 1 when a pod terminates. dicode will drain in-flight runs and exit cleanly within the `terminationGracePeriodSeconds` window.
:::

### MCP server daemons

Daemon tasks can expose an MCP (Model Context Protocol) server that other tasks interact with:

```yaml
trigger:
  daemon: true
runtime: docker
mcp_port: 3000
docker:
  image: my-mcp-server:latest
  ports:
    - 3000:3000
```

Other tasks can then call tools on this MCP server using the `mcp` SDK global:

::: code-group

```ts [Deno]
const tools = await mcp.list_tools("my-mcp-daemon");
const result = await mcp.call("my-mcp-daemon", "tool-name", { key: "value" });
```

```python [Python]
tools = mcp.list_tools("my-mcp-daemon")
result = mcp.call("my-mcp-daemon", "tool-name", {"key": "value"})
```

:::

::: warning
The calling task must declare MCP access in its permissions: `permissions.dicode.mcp: ["my-mcp-daemon"]`.
:::

### Daemon containers

Docker/Podman daemons are common for running services like databases, web servers, or custom tooling:

```yaml
apiVersion: dicode/v1
kind: Task
name: Nginx Dev Server
runtime: docker
trigger:
  daemon: true
docker:
  image: nginx:alpine
  ports:
    - 8888:80
  volumes:
    - /tmp:/usr/share/nginx/html:ro
  pull_policy: missing
```

Daemon tasks have no default timeout -- they run until stopped.

### Daemon states

Daemons cycle through a small set of states observable in the dashboard and via the REST API's `daemon_state` field:

| State | Meaning |
| --- | --- |
| `stopped` | Resting state. Either deliberately stopped, never started, or the body exited cleanly (`status: success`) with no restart configured. |
| `running` | The daemon body launched successfully and is up. |
| `stopping` | A restart is in flight -- the engine is tearing down the current run before re-firing the daemon. |
| `failed_after_preflight` | The daemon body's **launch** errored (binary missing, port already bound, runtime resource exhaustion -- `fireAsync` returned an error before the body ran). Terminal -- re-fire the daemon to retry. |
| `crashlooping`\* | The body has failed 3 consecutive quick starts (each dying within ~10s). Self-clearing, **not** terminal like `crashed`/`failed_after_preflight` -- it clears once a run finally sustains past the window, exits cleanly, is cancelled by an operator, or the task is unregistered. |
| `crashed` | The body started, then exited non-success (`failure`, `cancelled`, ...) **and** the restart policy will not restart it (`restart: never`, or `restart: on-failure` with a status not treated as a failure). Terminal -- re-fire the daemon to retry. |

\* Unlike the other rows, `crashlooping` isn't a state the daemon "enters" in its own right -- it's a masking override the engine reports on top of whatever the point-in-time state would otherwise be, regardless of what that underlying state is. Most commonly this masks a transient `running` reading: a hard-failing `restart: always` daemon still briefly shows `running` during each spawn-before-crash window, and once 3 consecutive quick failures accumulate, `crashlooping` is reported in place of that misleading reading until the daemon recovers. But the override isn't limited to masking `running` -- it applies on top of whatever state is currently stored.

`failed_after_preflight` means "body launch failed" -- the daemon body's launch errored before the body ran.

A run that backs a daemon reports one of the standard run statuses — `running`, `success`, `failure`, or `cancelled`. These are a **separate** enum from the daemon states above (there is no `crashed` run status, for example). A daemon killed before it exits (operator kill or engine shutdown) records `cancelled`.

::: tip Need a render → persist → start-daemon flow?
If your daemon needs config rendered and written to disk before it boots, model that as a [pipeline](./pipelines.md): a `kind: PipelineTask` whose render/persist stages run first and whose **terminal stage** is the daemon `kind: Task`.
:::

---

## Pipelines (render → persist → start-daemon)

To run an ordered sequence of stages before a daemon or body — render a config, persist it to disk, then start the daemon — declare a **`kind: PipelineTask`**. Each stage is an existing `kind: Task`; stages run sequentially, each stage's return value threads to the next via `${input.output}`, and the first failure short-circuits the rest. When the **terminal stage** is a daemon, the pipeline stays `running` for the daemon's lifetime.

See [Pipelines](./pipelines.md) for the full reference.
