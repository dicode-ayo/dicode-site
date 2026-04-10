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

When `auth: true` is set, both GET (UI) and POST (run) requests require a valid dicode session. Unauthenticated requests are redirected to the login page.

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
