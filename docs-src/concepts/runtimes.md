# Runtimes

dicode supports four runtimes for task execution. Each runtime is declared in `task.yaml` with the `runtime` field.

## Deno (TypeScript / JavaScript)

The default and most fully featured runtime. Uses [Deno](https://deno.com/) to run TypeScript or JavaScript tasks in a sandboxed environment.

- **Auto-installs**: dicode downloads and manages the Deno binary automatically. No manual installation required.
- **TypeScript native**: Write tasks in TypeScript with full type checking -- no build step needed.
- **npm imports**: Use any npm package directly with the `npm:` specifier.
- **Sandboxed**: Deno's permission system enforces the `permissions` block in `task.yaml`. Network, filesystem, environment, and subprocess access must be explicitly granted.
- **SDK globals**: All [SDK globals](./sdk.md) (`params`, `kv`, `input`, `output`, `mcp`, `dicode`) are injected automatically.

### Task structure

```
my-task/
  task.yaml
  task.ts          # or task.js
```

### Script format

Tasks export a default async function that receives the SDK globals:

```ts
export default async function main({ params, kv, input, output, mcp, dicode }: DicodeSdk) {
  const name = await params.get("name");
  console.log(`Hello, ${name}!`);
  return { greeting: `Hello, ${name}!` };
}
```

### npm imports

Use the `npm:` specifier to import any npm package without a package.json:

```ts
import Anthropic from "npm:@anthropic-ai/sdk";
import { z } from "npm:zod";

export default async function main({ params }: DicodeSdk) {
  // packages are cached automatically
}
```

### HTTP requests

Deno provides native `fetch()` -- no libraries needed:

```ts
const res = await fetch("https://api.github.com/repos/denoland/deno");
const data = await res.json();
```

### Environment variables

Access env vars declared in `permissions.env` via `Deno.env.get()`:

```ts
const token = Deno.env.get("GITHUB_TOKEN");
```

### Logging

Use standard `console` methods. stdout is captured as `info`, stderr as `error`:

```ts
console.log("info message");    // level: info
console.warn("warning");        // level: warn
console.error("error");         // level: error
console.debug("debug");         // level: debug
```

### Pausing for human input

A Deno task can call `dicode.suspend({ schema })` to pause mid-run and ask a human to fill in a JSON-Schema-described form, then resume later with the runner auto-dispatching to a `resume` function or a `steps` map -- no hand-rolled resume switch. See [Suspend & Resume](./suspend-resume.md).

### Dependency pinning

If a `deno.lock` file exists at or near the task directory, dicode automatically enforces it. The runtime walks up to two parent directories from the task directory looking for `deno.lock`. When found, Deno is invoked with `--lock=<path> --frozen`, which prevents per-run resolution of newer package versions — all imports are pinned to the exact versions recorded in the lockfile.

The canonical layout for buildin tasks places a shared lockfile two levels above the individual task folders:

```
tasks/
  deno.lock          # detected automatically for all buildin tasks
  buildin/
    my-task/
      task.yaml
      task.ts
```

**Opt-out**: If the task directory contains its own `deno.json` (note: `deno.jsonc` is not detected), the walk is skipped entirely. Deno respects whatever lock configuration that file declares.

**Stale-lock auto-recovery**: If the dependency graph has drifted from the committed `deno.lock` (for example, after adding a new `npm:` import without updating the lockfile), the `--frozen` run is rejected with a "lockfile is out of date" error. By default, dicode detects that exact signature, regenerates `deno.lock` across every `task.ts` entrypoint under the shared tree, and retries the run once automatically -- the run only fails if the regeneration itself errors or the retry still fails afterward. Every automatic regeneration emits an audit log line (task, lockfile path, before/after content-hash) to both the structured daemon log and the run log, and recovery is bounded to a single relock+retry per run, so a genuinely broken lock can't thrash.

Set `DICODE_DISABLE_LOCK_AUTORECOVERY=1` to opt out and restore the old hard-failure behavior -- useful for deployments that want to treat any lock drift as a supply-chain signal to investigate rather than silently heal. With auto-recovery disabled (or when it can't recover), fix the drift manually: run `deno install` (or `deno cache task.ts` for older Deno versions) inside the task directory to regenerate the lockfile, then commit the updated `deno.lock`.

**Unified relock**: See "Unified relock" in the Python section below for how `dicode relock` combines this pass with the Python one.

---

## Python

Runs tasks using [uv](https://docs.astral.sh/uv/), the fast Python package manager.

- **Auto-installs**: dicode downloads and manages `uv` automatically. No manual installation required. Python itself is managed by uv.
- **PEP 723 inline dependencies**: Declare dependencies directly in your script -- no `requirements.txt` or `pyproject.toml` needed.
- **Async detection**: If your script defines an `async def main()` function, the runtime detects it and runs `main()` via `asyncio.run()` with no arguments — SDK globals are available as module-level globals, same as sync tasks.
- **SDK globals**: All globals (`log`, `params`, `env`, `kv`, `input`, `output`, `mcp`, `dicode`) are available at module level.

### Task structure

```
my-task/
  task.yaml
  task.py
```

### Script format (sync)

SDK globals are available at module level. Assign to `result` to return a value:

```python
name = params.get("name", "World")
log.info(f"Hello, {name}!")

result = {"greeting": f"Hello, {name}!"}
```

### Script format (async)

Define an `async def main()` to use async variants of the SDK:

```python
# /// script
# dependencies = ["httpx>=0.27"]
# ///

import httpx

async def main():
    name = await params.get_async("name", "World")
    await log.info_async(f"Hello, {name}!")

    async with httpx.AsyncClient() as client:
        resp = await client.get("https://httpbin.org/get")

    return {"greeting": f"Hello, {name}!"}
```

When `async def main()` is present, the runtime detects it and calls `asyncio.run(main())` with no arguments. SDK globals (`params`, `log`, `kv`, `env`, `input`, `output`, `mcp`, `dicode`) are available at module level — the same as sync tasks.

### PEP 723 inline dependencies

Declare dependencies in a script metadata block at the top of your file:

```python
# /// script
# dependencies = ["httpx>=0.27", "beautifulsoup4"]
# ///

import httpx
from bs4 import BeautifulSoup
```

uv resolves and installs these dependencies automatically before running the script.

### Pausing for human input

Like Deno, Python tasks can call `dicode.suspend(schema=...)` to pause mid-run for a human-filled JSON-Schema form, then resume via an auto-dispatched `resume` function or a `steps` map. See [Suspend & Resume](./suspend-resume.md).

### Dependency pinning

If a `task.py.lock` sidecar exists next to `task.py` (written by `uv lock --script`), dicode stages it alongside the run and invokes `uv run --locked`. This pins every dependency to the exact versions and hashes recorded in the sidecar. By default, a drifted sidecar doesn't hard-fail the run: dicode detects uv's `` `--locked` was provided `` rejection, regenerates the `task.py.lock` sidecar for the failing script with `uv lock --script`, and retries the run once automatically -- only a failed regeneration or a still-failing retry surfaces as an error. This is the same stale-lock auto-recovery mechanism described in "Stale-lock auto-recovery" in the Deno section above; set `DICODE_DISABLE_LOCK_AUTORECOVERY=1` to opt out for both runtimes and restore the old hard-failure behavior. Every automatic regeneration emits an audit log line with the before/after lock content-hash, and recovery is bounded to a single relock+retry per run so a genuinely broken lock can't thrash. Tasks without a sidecar (including tasks with no PEP 723 block at all) run exactly as before, unlocked -- the same degrade behavior as the Deno runtime when no `deno.lock` is present.

Unlike Deno's single shared `deno.lock`, uv locks scripts individually -- each `task.py` gets its own sidecar next to it:

```
my-task/
  task.yaml
  task.py
  task.py.lock       # committed sidecar, detected automatically
```

When a task's dependencies change, regenerate the sidecar with `dicode python relock [dir]` (dir defaults to `tasks`). It provisions the pinned uv version dicode itself runs tasks with and runs `uv lock --script` for every `task.py` under the tree that carries a PEP 723 block, so the lock is deterministic regardless of any system uv. A `task.py.lock` left behind by a script that no longer has a PEP 723 block is orphaned -- it's deleted automatically.

**`--check` mode**: `dicode python relock --check` verifies without writing. It fails fast -- before uv is even provisioned -- on any missing lock sidecar or orphaned sidecar, then runs `uv lock --script --check` per script and exits non-zero on drift. Run it in CI to catch stale locks before they reach the runtime.

**Unified relock**: `dicode relock [--check] [dir]` runs this Python pass together with the Deno pass above in one shot, skipping whichever task kind isn't present under the tree -- one command, and one CI step, that covers both `deno.lock` and every `task.py.lock` sidecar. If the tree under `dir` has neither `task.ts` nor `task.py` files at all, `dicode relock` errors instead of silently doing nothing.

::: warning Pin `requires-python` for a reproducible lock
Without a `requires-python` constraint in the PEP 723 block, uv resolves against whatever Python version is the environment default -- which can differ between a dev machine and CI -- so the lock it generates won't reproduce elsewhere. `dicode python relock` prints a warning when a lockable script omits it:

```python
# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx>=0.27"]
# ///
```
:::

### Logging

Use the `log` global (not `print`):

```python
log.info("info message")
log.warn("warning")
log.error("error message")
log.debug("debug info")
```

### Environment variables

Use the `env` global:

```python
token = env.get("GITHUB_TOKEN")
```

---

## Docker

Run tasks in any Docker container. Supports any language, any toolchain.

- **Any image**: Use any public or private Docker image.
- **Dockerfile builds**: Build custom images from a Dockerfile in the task directory. Images are tagged `dicode-<taskID>:<hash>` and cached; rebuilds only happen when the Dockerfile changes.
- **Live logs**: Container stdout/stderr is streamed to the run log in real time.
- **Kill support**: Long-running containers can be stopped from the UI or CLI.
- **Orphan cleanup**: dicode tracks all containers it starts and cleans up orphans on restart.
- **Security floor**: Certain host-facing options (`network_mode: host`, dangerous `cap_add`, insecure `security_opt`, sensitive bind mounts) are rejected by default. See [Container Security](/getting-started/configuration#container-security) for details and opt-in configuration.

### Task structure

Using a pre-built image:

```yaml
# task.yaml
apiVersion: dicode/v1
kind: Task
name: My Docker Task
runtime: docker
trigger:
  manual: true
docker:
  image: alpine:latest
  command: ["echo", "Hello from Docker!"]
```

Using a Dockerfile:

```
my-task/
  task.yaml
  Dockerfile
```

```yaml
# task.yaml
apiVersion: dicode/v1
kind: Task
name: Custom Docker Task
runtime: docker
trigger:
  manual: true
docker:
  build:
    dockerfile: Dockerfile
```

### Docker config block

The `docker:` block supports all the options you would expect:

```yaml
docker:
  image: nginx:alpine
  command: ["nginx", "-g", "daemon off;"]
  entrypoint: ["/bin/sh", "-c"]
  volumes:
    - /tmp:/usr/share/nginx/html:ro
    - /var/log:/logs
  ports:
    - 8080:80
    - 3000:3000/tcp
  working_dir: /app
  env_vars:
    NODE_ENV: production
  pull_policy: missing    # always | missing (default) | never
```

::: tip Template variable expansion in Docker fields
`${VAR}` substitution is supported in `command`, `entrypoint`, `working_dir`,
`build.context`, `build.dockerfile`, and `volumes`. The most useful built-in is
`${TASK_DIR}`, which resolves to the absolute path of the task's own directory.

```yaml
docker:
  build:
    context: "${TASK_DIR}"
    dockerfile: "${TASK_DIR}/Dockerfile"
  volumes:
    - "${TASK_DIR}/config:/app/config:ro"
```

Daemon process environment variables are **not** a fallback in these fields
(`envFallback: false`). To pass host env vars into the container, use
`permissions.env` and `docker.env_vars`.

See [Template variables](/concepts/tasks#template-variables) for the full list of
supported fields and built-in variables.
:::

### Daemon containers

Docker tasks work well as daemons -- long-running services that start with dicode:

```yaml
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

::: warning Container security floor
By default, dicode rejects Docker and Podman task configurations that use host networking, dangerous Linux capabilities, insecure `security_opt` values, or bind mounts to sensitive system paths. Tasks with such configuration will fail at start time with a descriptive error.

To opt in to a specific exception, add a `container_security:` block to `dicode.yaml` — see [Container Security](/getting-started/configuration#container-security). Named and anonymous volumes (not host bind-mounts) are always allowed.
:::

::: info Network isolation
When `permissions.net` is empty and the task publishes no `docker.ports`, the container starts with `network_mode: none` — no outbound network access. Declare `permissions.net: ["*"]` for unrestricted network, or list specific hosts (allowed but not yet per-host enforced; a warning is logged). An explicit `docker.network_mode` always takes precedence.
:::

---

## Podman

A rootless, daemonless alternative to Docker. Uses the same `docker:` config block.

- **Rootless**: Runs containers without root privileges.
- **Same config**: Uses the identical `docker:` block in task.yaml -- just change `runtime: podman`.
- **Drop-in replacement**: If you can run it with Docker, you can run it with Podman.
- **Security floor**: Certain host-facing options (`network_mode: host`, dangerous `cap_add`, insecure `security_opt`, sensitive bind mounts) are rejected by default. See [Container Security](/getting-started/configuration#container-security) for details and opt-in configuration.
- **Network isolation**: Same zero-default as Docker — containers with empty `permissions.net` and no published ports start with `network_mode: none`. See the Docker section above.

```yaml
apiVersion: dicode/v1
kind: Task
name: Rootless Container
runtime: podman
trigger:
  manual: true
docker:
  image: alpine:latest
  command: ["echo", "Hello from Podman!"]
```

::: tip
Podman must be installed on the host system. Unlike Deno and Python, dicode does not auto-install container runtimes.
:::
