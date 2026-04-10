# Your First Task

This guide walks you through creating a cron task that runs every minute, uses the key-value store, and returns a value. By the end you will understand the task directory layout, the `task.yaml` spec, and how to trigger and inspect runs.

## 1. Create the task directory

Each task lives in its own directory inside a source. If you followed the [quickstart](./), you already have `~/dicode-tasks/` configured as a local source.

```sh
mkdir -p ~/dicode-tasks/hello-cron
```

## 2. Write task.yaml

Create `~/dicode-tasks/hello-cron/task.yaml`:

```yaml
apiVersion: dicode/v1
kind: Task
name: Hello Cron
description: A simple task that counts how many times it has run.
runtime: deno

trigger:
  cron: "* * * * *"

timeout: 30s
```

This tells dicode to run the task every minute using the Deno runtime with a 30-second timeout.

## 3. Write the task script

Create `~/dicode-tasks/hello-cron/task.ts`:

```ts
export default async function main({ kv, output }) {
  // Read the run counter from the persistent KV store
  const prev = (await kv.get("run_count")) as number | null;
  const count = (prev ?? 0) + 1;

  // Persist the updated counter
  await kv.set("run_count", count);

  console.log(`Hello from dicode! Run #${count}`);

  // Return a value -- visible in `dicode run` output and the web UI
  return { count, message: `This task has run ${count} time(s)` };
}
```

Key points:

- The default export receives the [SDK globals](/concepts/sdk): `params`, `kv`, `input`, `output`, and more.
- `kv.get()` / `kv.set()` persist data in SQLite across runs. Each task has its own KV namespace.
- `console.log()` writes to the run log, visible via `dicode logs`.
- The return value is stored with the run and shown in CLI output.

## 4. Add the task to your taskset

Update `~/dicode-tasks/taskset.yaml` to include the new task:

```yaml
apiVersion: dicode/v1
kind: TaskSet
name: my-tasks
tasks:
  - hello-cron
```

## 5. The daemon picks it up

Because `~/dicode-tasks` is a local source with file watching enabled (the default), the daemon detects the new files and registers the task automatically. This typically takes under 100ms.

Verify it appears:

```sh
dicode list
```

You should see output like:

```
ID                             TRIGGER      LAST STATUS NAME
hello-cron                     cron         -          Hello Cron
```

## 6. Trigger a manual run

You do not have to wait for the cron schedule. Trigger the task immediately:

```sh
dicode run hello-cron
```

The CLI waits for the run to complete, streams the logs, and prints the return value:

```
Hello from dicode! Run #1
run abc123: success
{
  "count": 1,
  "message": "This task has run 1 time(s)"
}
```

## 7. Check the logs

Every run gets a unique run ID. To see the logs for a specific run:

```sh
dicode logs <run-id>
```

```
2026-04-10T12:00:00Z [info] Hello from dicode! Run #1
```

You can also check the latest status:

```sh
dicode status hello-cron
```

## What happened under the hood

1. **Source watcher** detected the new `task.yaml` via `fsnotify` and notified the reconciler.
2. **Reconciler** parsed the spec, validated it, and registered the task in the in-memory registry.
3. **Trigger engine** scheduled a cron job based on the `"* * * * *"` expression (or you triggered it manually with `dicode run`).
4. **Deno runtime** spawned a sandboxed Deno subprocess with the task script. The SDK globals (`kv`, `params`, etc.) communicate with the daemon over a per-run Unix socket using the IPC protocol.
5. **SQLite** stored the run result, logs, KV data, and return value.

## Using params

Tasks can accept parameters. Add a `params` section to `task.yaml`:

```yaml
params:
  name:
    description: Who to greet
    default: "world"
```

Then use them in your script:

```ts
export default async function main({ params }) {
  const name = await params.get("name");
  console.log(`Hello, ${name}!`);
  return { greeting: `Hello, ${name}!` };
}
```

Pass params from the CLI:

```sh
dicode run hello-cron name=dicode
```

## Python alternative

The same task in Python using the `uv` runtime (no system Python required):

`task.yaml`:
```yaml
apiVersion: dicode/v1
kind: Task
name: Hello Cron (Python)
description: A simple Python task that counts runs.
runtime: python

trigger:
  cron: "* * * * *"

timeout: 30s
```

`task.py`:
```python
count = (kv.get("run_count") or 0) + 1
kv.set("run_count", count)

log.info(f"Hello from dicode! Run #{count}")

result = {"count": count, "message": f"This task has run {count} time(s)"}
```

Python tasks have the SDK globals injected as module-level variables: `log`, `params`, `env`, `kv`, `input`, `output`. To return a value, assign to the `result` variable.

You can add inline dependencies using [PEP 723](https://peps.python.org/pep-0723/):

```python
# /// script
# dependencies = ["requests>=2.31"]
# ///
import requests

data = requests.get("https://api.github.com").json()
log.info(data["current_user_url"])
result = data
```

## Next steps

- [Configuration Reference](./configuration) -- full `dicode.yaml` options
- [Runtimes](/concepts/runtimes) -- Deno, Python, Docker, and Podman details
- [Triggers](/concepts/triggers) -- cron, webhook, manual, chain, and daemon triggers
- [SDK Globals](/concepts/sdk) -- `kv`, `params`, `output`, `input`, `mcp`, `dicode`
- [Secrets](/concepts/secrets) -- inject secrets into task environment variables
