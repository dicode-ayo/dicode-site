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

**Missing lockfile entry**: If an import is not present in the lockfile (for example, after adding a new `npm:` dependency without updating the lockfile), Deno fails at task startup with a lockfile integrity error. Fix it by running `deno install` (or `deno cache task.ts` for older Deno versions) inside the task directory to regenerate the lockfile, then commit the updated `deno.lock`.

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

---

## Podman

A rootless, daemonless alternative to Docker. Uses the same `docker:` config block.

- **Rootless**: Runs containers without root privileges.
- **Same config**: Uses the identical `docker:` block in task.yaml -- just change `runtime: podman`.
- **Drop-in replacement**: If you can run it with Docker, you can run it with Podman.
- **Security floor**: Certain host-facing options (`network_mode: host`, dangerous `cap_add`, insecure `security_opt`, sensitive bind mounts) are rejected by default. See [Container Security](/getting-started/configuration#container-security) for details and opt-in configuration.

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
