# SDK Globals

Every task script has access to a set of SDK globals that provide structured interaction with dicode. In Deno tasks, these are passed as properties of the argument to your `main()` function. In Python tasks, they are available at module level.

## params

Read task parameters declared in `task.yaml`. Values are always strings.

::: code-group

```ts [Deno]
export default async function main({ params }: DicodeSdk) {
  const repo = await params.get("repo");     // string | null
  const all = await params.all();             // Record<string, string>
}
```

```python [Python]
name = params.get("name", "World")     # returns default if missing
all_params = params.all()               # dict[str, str]
```

:::

In async Python tasks, use the `_async` variants:

```python
async def main():
    name = await params.get_async("name", "World")
    all_params = await params.all_async()
```

### API

| Method | Deno | Python (sync) | Python (async) |
|--------|------|---------------|----------------|
| Get one param | `await params.get(key)` | `params.get(key, default)` | `await params.get_async(key, default)` |
| Get all params | `await params.all()` | `params.all()` | `await params.all_async()` |

---

## kv

A persistent key-value store scoped to the task. Values are JSON-serializable and survive across runs. Useful for storing state like counters, last-seen timestamps, or cached data.

::: code-group

```ts [Deno]
export default async function main({ kv }: DicodeSdk) {
  // Read
  const prev = await kv.get("counter") as number | null;

  // Write
  await kv.set("counter", (prev ?? 0) + 1);

  // List all keys (optional prefix filter)
  const all = await kv.list();
  const filtered = await kv.list("github:");

  // Delete
  await kv.delete("old-key");
}
```

```python [Python]
# Read
prev = kv.get("counter")

# Write
kv.set("counter", (prev or 0) + 1)

# List all keys (optional prefix filter)
all_keys = kv.list()
filtered = kv.list("github:")

# Delete
kv.delete("old-key")
```

:::

In async Python tasks:

```python
async def main():
    prev = await kv.get_async("counter")
    await kv.set_async("counter", (prev or 0) + 1)
    all_keys = await kv.list_async()
    await kv.delete_async("old-key")
```

### API

| Method | Deno | Python (sync) | Python (async) |
|--------|------|---------------|----------------|
| Get | `await kv.get(key)` | `kv.get(key)` | `await kv.get_async(key)` |
| Set | `await kv.set(key, value)` | `kv.set(key, value)` | `await kv.set_async(key, value)` |
| Delete | `await kv.delete(key)` | `kv.delete(key)` | `await kv.delete_async(key)` |
| List | `await kv.list(prefix?)` | `kv.list(prefix="")` | `await kv.list_async(prefix="")` |

---

## input

The input data from an upstream source. This is set when a task is triggered by a chain (return value of the upstream task) or a webhook (request body). For manual or cron tasks, `input` is `null`/`None`.

::: code-group

```ts [Deno]
export default async function main({ input }: DicodeSdk) {
  const data = input as { event: string; payload: unknown } | null;
  if (data) {
    console.log(`Received event: ${data.event}`);
  }
}
```

```python [Python]
# input is available at module level
if input:
    log.info(f"Received event: {input['event']}")
```

:::

---

## output

Produce visible output for the task run. Output is displayed in the web UI on the run's result page.

::: code-group

```ts [Deno]
export default async function main({ output }: DicodeSdk) {
  // Render HTML (displayed in the result page)
  await output.html("<h1>Hello!</h1>", { data: { key: "value" } });

  // Plain text
  await output.text("Task completed successfully.");

  // Image (base64-encoded content)
  await output.image("image/png", base64EncodedPng);

  // File download
  await output.file("report.csv", csvContent, "text/csv");
}
```

```python [Python]
# Render HTML
output.html("<h1>Hello!</h1>", data={"key": "value"})

# Plain text
output.text("Task completed successfully.")

# Image (base64-encoded content)
output.image("image/png", base64_encoded_png)

# File download
output.file("report.csv", csv_content, "text/csv")
```

:::

In async Python tasks, use the `_async` variants:

```python
async def main():
    await output.html_async("<h1>Hello!</h1>")
    await output.text_async("Done.")
```

### API

| Method | Deno | Python (sync) | Python (async) |
|--------|------|---------------|----------------|
| HTML | `await output.html(content, opts?)` | `output.html(content, data=None)` | `await output.html_async(content, data=None)` |
| Text | `await output.text(content)` | `output.text(content)` | `await output.text_async(content)` |
| Image | `await output.image(mime, content)` | `output.image(mime, content)` | `await output.image_async(mime, content)` |
| File | `await output.file(name, content, mime?)` | `output.file(name, content, mime=None)` | `await output.file_async(name, content, mime=None)` |

The `data` option in `output.html()` attaches structured data alongside the HTML output. This is useful when webhook task UIs need to read both rendered HTML and machine-readable values.

---

## dicode

Interact with the dicode daemon to run tasks, list tasks, inspect runs, and manage secrets.

::: warning
All `dicode` methods require explicit permission in `task.yaml`. See the `permissions.dicode` section in [Tasks](./tasks.md).
:::

::: code-group

```ts [Deno]
export default async function main({ dicode }: DicodeSdk) {
  // Run another task (requires permissions.dicode.tasks)
  const result = await dicode.run_task("other-task", { key: "value" });

  // List all registered tasks (requires permissions.dicode.list_tasks)
  const tasks = await dicode.list_tasks();

  // Get recent runs for a task (requires permissions.dicode.get_runs)
  const runs = await dicode.get_runs("other-task", { limit: 5 });

  // Manage secrets (requires permissions.dicode.secrets_write)
  await dicode.secrets_set("MY_API_KEY", "sk-abc123");
  await dicode.secrets_delete("OLD_KEY");
}
```

```python [Python]
# Run another task (requires permissions.dicode.tasks)
result = dicode.run_task("other-task", {"key": "value"})

# List all registered tasks (requires permissions.dicode.list_tasks)
tasks = dicode.list_tasks()

# Get recent runs for a task (requires permissions.dicode.get_runs)
runs = dicode.get_runs("other-task", limit=5)
```

:::

In async Python tasks:

```python
async def main():
    result = await dicode.run_task_async("other-task", {"key": "value"})
    tasks = await dicode.list_tasks_async()
    runs = await dicode.get_runs_async("other-task", limit=5)
```

### API

| Method | Deno | Python (sync) | Python (async) |
|--------|------|---------------|----------------|
| Run task | `await dicode.run_task(id, params?)` | `dicode.run_task(id, params=None)` | `await dicode.run_task_async(id, params=None)` |
| List tasks | `await dicode.list_tasks()` | `dicode.list_tasks()` | `await dicode.list_tasks_async()` |
| Get runs | `await dicode.get_runs(id, opts?)` | `dicode.get_runs(id, limit=10)` | `await dicode.get_runs_async(id, limit=10)` |
| Set secret | `await dicode.secrets_set(key, value)` | -- | -- |
| Delete secret | `await dicode.secrets_delete(key)` | -- | -- |

::: tip
`secrets_set` and `secrets_delete` are available in Deno only. Tasks can write secrets but never read them back -- secret values are injected as environment variables via `permissions.env`.
:::

### Required permissions

```yaml
permissions:
  dicode:
    tasks: ["target-task-id"]    # or ["*"] for all
    list_tasks: true
    get_runs: true
    secrets_write: true
    mcp: ["mcp-daemon-id"]
```

---

## dicode.runs.replay

Re-fire an earlier run with its persisted input. The new run carries `triggerSource = "replay"` and `parent_run_id = <original>` so the engine suppresses `on_failure_chain` on its failure (no replay loops).

Used by the auto-fix loop to retry a failed run after an AI agent has patched the source. Requires run-input persistence.

::: code-group

```ts [Deno]
const { run_id } = await dicode.runs.replay(originalRunID);

// Replay against a different task (e.g. a debug variant)
const { run_id } = await dicode.runs.replay(originalRunID, "echo-debug");
```

```python [Python]
new = dicode.runs.replay(original_run_id)
new = dicode.runs.replay(original_run_id, task_name="echo-debug")
# {"run_id": "..."}
```

:::

```yaml
permissions:
  dicode:
    runs_replay: true
```

---

## dicode.tasks.test

Run a task's sibling test file (`task.test.{ts,js,py}`) and return the result. Same shape as `POST /api/tasks/{id}/test`.

::: code-group

```ts [Deno]
const result = await dicode.tasks.test("user-task");
// { passed, failed, output }
```

```python [Python]
result = dicode.tasks.test("user-task")
```

:::

```yaml
permissions:
  dicode:
    tasks_test: true
```

---

## dicode.sources.set_dev_mode

Toggle dev mode on a configured taskset source. Two modes:

- **local-path:** point the source at a local checkout for live edits
- **clone-mode:** clone the remote into a per-fix directory checked out on a feature branch (used by auto-fix; cloned at `${data}/dev-clones/<source>/<run_id>/`)

::: code-group

```ts [Deno]
// Local-path dev mode
await dicode.sources.set_dev_mode("infra", {
  enabled: true,
  local_path: "/home/dev/infra/taskset.yaml",
});

// Clone-mode (auto-fix flow)
await dicode.sources.set_dev_mode("infra", {
  enabled: true,
  branch: "fix/auto-2026-04-30",
  base: "main",
  run_id: "abc123",
});

// Disable
await dicode.sources.set_dev_mode("infra", { enabled: false });
```

```python [Python]
dicode.sources.set_dev_mode(
    "infra",
    enabled=True,
    local_path="/home/dev/infra/taskset.yaml",
)

dicode.sources.set_dev_mode(
    "infra",
    enabled=True,
    branch="fix/auto-2026-04-30",
    base="main",
    run_id="abc123",
)

dicode.sources.set_dev_mode("infra", enabled=False)
```

:::

```yaml
permissions:
  dicode:
    sources_set_dev_mode: true
```

---

## dicode.git.commit_push

Add, commit, and push a branch in one call (pure go-git — no `git` binary). Validates the branch against an optional `branch_prefix`; never sets `--force`.

`auth_token_env` names a daemon-process env var holding the token. It **must** be declared in the task's `permissions.env` to prevent arbitrary env-var disclosure. The token is passed as HTTPS basic-auth with username `x-access-token` (compatible with GitHub fine-grained PATs).

::: code-group

```ts [Deno]
const { commit } = await dicode.git.commit_push("infra", {
  message: "fix: handle nil receiver in worker",
  branch: "fix/auto-2026-04-30",
  branch_prefix: "fix/",
  files: ["worker.ts"],         // omit to stage all tracked changes
  author_name: "auto-fix",
  author_email: "auto-fix@dicode.local",
  auth_token_env: "GITHUB_TOKEN",
});
```

```python [Python]
result = dicode.git.commit_push(
    "infra",
    message="fix: handle None receiver in worker",
    branch="fix/auto-2026-04-30",
    branch_prefix="fix/",
    files=["worker.py"],
    author_name="auto-fix",
    author_email="auto-fix@dicode.local",
    auth_token_env="GITHUB_TOKEN",
)
# {"commit": "<hex sha>"}
```

:::

```yaml
permissions:
  env:
    - GITHUB_TOKEN              # required for auth_token_env to resolve
  dicode:
    git_commit_push: true
```

### Branch authorization

| `branch_prefix` | `allow_main` | `branch` value | Result |
|---|---|---|---|
| `"fix/"` | _any_ | `fix/foo` | ✓ allowed |
| `"fix/"` | `true` | `main` / `master` | ✓ allowed |
| `"fix/"` | `false` | `main` | ✗ rejected |
| `""` | `true` | `main` / `master` | ✓ allowed |
| `""` | `true` | `feature/foo` | ✗ rejected |
| `""` | `false` | _any_ | ✗ rejected |

::: tip
Empty `branch_prefix` is intentionally only legal for `main` / `master` with `allow_main: true`. Any other configuration is rejected to prevent accidental wide-open pushes.
:::

---

## mcp

Call tools on **external** MCP (Model Context Protocol) servers exposed by daemon tasks. To go the other direction — let an external MCP client (Claude Desktop, Cursor, Claude Code) call into dicode — see [MCP Server](./mcp-server).

::: code-group

```ts [Deno]
export default async function main({ mcp }: DicodeSdk) {
  // List available tools on an MCP server
  const tools = await mcp.list_tools("my-mcp-daemon");

  // Call a specific tool
  const result = await mcp.call("my-mcp-daemon", "search", {
    query: "test",
    limit: 10,
  });
}
```

```python [Python]
# List available tools
tools = mcp.list_tools("my-mcp-daemon")

# Call a specific tool
result = mcp.call("my-mcp-daemon", "search", {"query": "test", "limit": 10})
```

:::

In async Python tasks:

```python
async def main():
    tools = await mcp.list_tools_async("my-mcp-daemon")
    result = await mcp.call_async("my-mcp-daemon", "search", {"query": "test"})
```

### API

| Method | Deno | Python (sync) | Python (async) |
|--------|------|---------------|----------------|
| List tools | `await mcp.list_tools(name)` | `mcp.list_tools(name)` | `await mcp.list_tools_async(name)` |
| Call tool | `await mcp.call(name, tool, args?)` | `mcp.call(name, tool, args=None)` | `await mcp.call_async(name, tool, args=None)` |

The `name` parameter is the task ID of the daemon that exposes the MCP server.

::: warning
Requires `permissions.dicode.mcp: ["daemon-task-id"]` in `task.yaml`.
:::

---

## Logging

::: code-group

```ts [Deno]
// Use standard console methods
console.log("info level message");
console.warn("warning message");
console.error("error message");
console.debug("debug message");
```

```python [Python]
# Use the log global
log.info("info level message")
log.warn("warning message")
log.error("error message")
log.debug("debug message")
```

:::

In Deno, `console.log` and `console.info` are captured at `info` level. `console.warn` maps to `warn` and `console.error` to `error`. All log output is streamed in real time to the run log in the web UI.

In async Python tasks, use `await log.info_async(...)` etc.

---

## HTTP requests

::: code-group

```ts [Deno]
// Native fetch() -- no imports needed
const res = await fetch("https://api.github.com/repos/denoland/deno");
const data = await res.json();
```

```python [Python]
# Use any HTTP library (declare it in PEP 723 inline deps)
# /// script
# dependencies = ["httpx>=0.27"]
# ///
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.github.com/repos/denoland/deno")
        data = resp.json()
```

:::

Deno has `fetch()` built in. Python tasks can use any HTTP library -- `httpx`, `requests`, `urllib3` -- declared as a PEP 723 inline dependency.

---

## Environment variables

::: code-group

```ts [Deno]
const token = Deno.env.get("GITHUB_TOKEN");
```

```python [Python]
token = env.get("GITHUB_TOKEN")
```

:::

Environment variables must be declared in `task.yaml` under `permissions.env`. See [Secrets](./secrets.md) for how to inject secrets as environment variables.

---

## Return values

Tasks return structured data by returning from the main function (Deno) or assigning to `result` (Python).

::: code-group

```ts [Deno]
export default async function main({ params }: DicodeSdk) {
  return { status: "ok", count: 42 };
}
```

```python [Python]
# Sync: assign to result
result = {"status": "ok", "count": 42}

# Async: return from main()
async def main():
    return {"status": "ok", "count": 42}
```

:::

Return values are:
- Stored with the run record and visible in the web UI
- Passed as `input` to chained downstream tasks
- Available via `dicode.get_runs()` in other tasks
