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

### Session authentication

For webhooks that should only be accessible to authenticated dicode users (not external services):

```yaml
trigger:
  webhook: /hooks/dashboard
  auth: true
```

When `auth: true` is set, both GET (UI) and POST (run) requests require a valid dicode session. Any webhook task can opt in — for example, the built-in dashboard at `/hooks/webui` and the `dicodai` preset at `/hooks/ai/dicodai` both ship with `auth: true` because they're only ever called from within an authenticated dicode session.

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
| `stopped` | Resting state (clean exit). Either deliberately stopped, never started, or ran to completion with `status: success` and no restart configured. |
| `prereq_running` | The `trigger.before` preflight pipeline is executing. |
| `prereq_failed` | A preflight stage returned a non-success status. The daemon will not start until the failing stage is re-fired successfully. |
| `running` | The daemon body is executing. |
| `stopping` | The engine is shutting the daemon down (operator unregister or engine shutdown). |
| `failed_after_preflight` | Preflight succeeded, but the daemon's own dispatch errored (binary missing, port already bound, etc.). Terminal — re-fire the daemon to retry. |
| `crashed` | The daemon's body ran but exited non-success and the restart policy isn't going to restart it. Distinct from `stopped` so clean exits and crashes are visibly different. Terminal — re-fire the daemon to retry. |

---

## Preflight pipelines

Any trigger type — daemon, manual, cron, webhook, or chain — can declare a `trigger.before:` pipeline of one-shot prereq tasks that must succeed before the main task body runs. Stages run **sequentially in declaration order**, and each stage's return value is piped to the next via `${input.output}`. If any stage fails, the pipeline short-circuits and the main body does not run.

```yaml
trigger:
  daemon: true
  restart: always
  before:
    # Stage 1: render config from secrets + literal values.
    - task: buildin/template
      overrides:
        params:
          template: |
            base_url: ${BASE_URL}
            password: ${STATUS_PASSWORD}
        env:
          - name: BASE_URL
            value: "https://relay.example.com"
          - name: STATUS_PASSWORD
            from: task:secret-providers/doppler

    # Stage 2: persist stage 1's rendered output to disk.
    - task: buildin/write-local
      overrides:
        params:
          content: "${input.output}"
          path: "${DATADIR}/relay/relay.yaml"
          mode: "0600"
        fs:
          - path: "${DATADIR}/relay"
            permission: rw
```

Each `before[]` entry can be a bare task-ID string or a `{task, overrides}` mapping. Per-edge overrides accept the same conservative subset as `trigger.chain.overrides` (`params`, `env`, `net`, `fs`, `timeout`, `dicode`, `runtime` — not `trigger`, `enabled`, `name`, etc.). Forms can be mixed within the same list.

The engine re-fires every stage on every preflight attempt — there's no "already-satisfied" short-circuit — because the point of preflight is to refresh ephemeral state (rendered configs, freshly rotated credentials) right before the body runs.

**Run-row semantics on failure:**

- **Daemon** — preflight failure leaves the daemon in `prereq_failed` and no daemon-body run is created.
- **One-shot** (manual / cron / webhook / chain) — preflight + body collapse into a single parent run row. Preflight failure surfaces as `status=failure` with `fail_reason="preflight_failed: stage N (<task-id>): <error>"`.

Preflight stages run as their own child runs tagged `trigger_source=preflight`, linked back to the parent fire — the dashboard groups them under the parent for visibility.

### `${input.output}` interpolation

Three reference shapes are recognised at dispatch time in `before[i].overrides.params` defaults and `trigger.chain.params` values:

| Form | Resolves to |
| --- | --- |
| `${input.output}` | upstream's full string return value |
| `${input.output.<field>}` | named string field of an object-shaped upstream return (e.g. `{path: "..."}`) |
| `${input.params.<name>}` | named entry from the upstream's `RunOptions.Params` (chain edge only — preflight edges run with empty params) |

Embedded forms (`"prefix-${input.output}-suffix"`) and multi-token forms (`"${input.params.scheme}://${input.output.host}"`) work too — any string containing one or more recognised tokens is rewritten in place. The `<field>` / `<name>` portion accepts letters, digits, underscores, hyphens, and dots, so common shapes like `${input.params.x-forwarded-for}` and `${input.output.db.host}` work without escapes.

References that can't be resolved at dispatch time fail loud — the chain or preflight dispatch is skipped rather than passing a literal token to the downstream. Unknown shapes (e.g. `${input.foo}`) are rejected at task-registration time with a site-qualified error so misuse surfaces at config-load.

The first stage (`before[0]`) has no upstream return value, so any `${input.…}` reference there is rejected at registration. Use a literal default or an env-projected secret on stage 0; downstream stages can then pipe via `${input.output}`.

### Mid-pipeline re-fire (daemon-only)

When an intermediate stage at index `i` re-runs successfully — e.g. an operator manually fires `buildin/template` to pick up a rotated secret — the engine re-fires stages `[i+1..n-1]` with the re-run's fresh return value as the initial `${input.output}`, then restarts the daemon to pick up the propagated config. Propagations are coalesced per daemon (at most one in flight) so a flurry of upstream completions produces a single re-render + restart, not a thrash loop. One-shots don't auto-restart on a prereq re-run — re-fire the one-shot yourself if you want it to re-run.

### Registration-time validation

The engine rejects at registration:

- References to unknown tasks.
- References to daemons (only one-shot tasks can be preflights).
- Self-references and cycles in the before-graph (e.g. `A.before: [B]; B.before: [A]`).
- `${input.params.<name>}` on any `before[]` edge — preflight stages run with empty `RunOptions`, so the upstream params channel is statically unavailable.

For an end-to-end example combining daemon preflight, per-edge overrides, `${DATADIR}` volumes, and secret rotation, see the [Cloudflare Tunnel worked example](https://github.com/dicode-ayo/dicode-core/blob/main/docs/examples/cloudflare-tunnel.md) in dicode-core.
