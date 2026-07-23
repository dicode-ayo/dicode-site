# Example: Docker Container Task

dicode can run tasks inside Docker (or Podman) containers. This is useful for
tasks that need specific system dependencies, long-running daemons, or
complete environment isolation.

## Example 1: Nginx dev server (daemon)

A daemon task starts a container and keeps it running until you stop it.

### task.yaml

```yaml
apiVersion: dicode/v1
kind: Task
name: Nginx Dev Server
description: Starts an Nginx container serving /tmp on port 8888. Kill from the run page when done.
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

Key fields:

- **`runtime: docker`** tells dicode to run this task as a container instead
  of a Deno or Python script.
- **`trigger.daemon: true`** keeps the container running indefinitely. Use
  the dicode UI or `dicode kill <run-id>` to stop it.
- **`docker.image`** specifies the container image. dicode pulls it
  automatically based on the `pull_policy`.
- **`docker.ports`** maps host ports to container ports.
- **`docker.volumes`** bind-mounts host directories into the container.
- **`docker.pull_policy`** controls when dicode pulls the image. `missing`
  only pulls if the image is not already available locally.

### Running it

```bash
dicode run nginx-dev-server
```

Open `http://localhost:8888` to see files from `/tmp` served by Nginx.
Container logs stream into the dicode run log in real time.

## Example 2: Custom Dockerfile build

When your task needs a custom image, point dicode at a Dockerfile in the
task directory.

### Directory structure

```
tasks/data-processor/
  task.yaml
  Dockerfile
```

### task.yaml

```yaml
apiVersion: dicode/v1
kind: Task
name: Data Processor
description: Builds a custom Alpine image and runs a data processing script
runtime: docker

trigger:
  manual: true

docker:
  build:
    dockerfile: Dockerfile

timeout: 60s
```

When `docker.build` is present, dicode builds the image from the specified
Dockerfile before running the container. The build context is the task
directory.

### Dockerfile

```dockerfile
FROM python:3.12-alpine

WORKDIR /app
RUN pip install --no-cache-dir pandas

COPY process.py .

CMD ["python", "process.py"]
```

### Running it

```bash
dicode run data-processor
```

dicode builds the image on first run (and when files change), then starts
the container. Build output and container logs both stream to the run log.

## Container lifecycle

dicode manages the full container lifecycle:

- **Live logs** -- Container stdout and stderr stream to the dicode run log
  in real time, visible in the UI and CLI.
- **Kill support** -- Stop a running container from the UI or with
  `dicode kill <run-id>`. dicode sends SIGTERM, waits briefly, then
  SIGKILL if needed.
- **Orphan cleanup** -- If dicode restarts or the daemon process exits
  unexpectedly, orphaned containers are detected and cleaned up on the
  next startup. Containers are labeled with dicode metadata for tracking.
- **Exit codes** -- The container's exit code becomes the task run's exit
  code. Non-zero exits are treated as failures and fire
  `on_failure_chain` if one is configured at the task or `defaults` level.

## Example 3: Injecting a secret as a container env var

`permissions.env` entries -- including `secret:`-backed lookups -- are resolved
and merged into the container environment, not just literal `docker.env_vars`.

### task.yaml

```yaml
apiVersion: dicode/v1
kind: Task
name: Slack Notifier
description: Posts a message to Slack using a secret-backed webhook URL
runtime: docker

trigger:
  manual: true

permissions:
  env:
    - name: SLACK_WEBHOOK_URL
      secret: slack_webhook_url

docker:
  image: curlimages/curl:latest
  command:
    - sh
    - -c
    - curl -s -X POST -H 'Content-Type: application/json' -d '{"text":"hello from dicode"}' "$SLACK_WEBHOOK_URL"
```

dicode resolves `slack_webhook_url` from the secrets store and injects it into
the container as `SLACK_WEBHOOK_URL`. The container never inherits the
daemon's own environment -- only what the task's `permissions.env` and
`docker.env_vars` declare reaches it. If `docker.env_vars` also set
`SLACK_WEBHOOK_URL` to some literal value, the resolved secret would win on
the name collision.

Secret values injected this way are redacted from streamed container logs,
same as for Deno and Python tasks.

::: tip Which `permissions.env` forms reach Docker/Podman?
Named `secret:`, `from:`, and `value:` entries all reach docker/podman
containers. Bare pattern entries (e.g. `"GITHUB_*"`) do not -- those only
forward for the Deno/Python subprocess runtimes. See
[Secrets](/concepts/secrets) and [Tasks: `permissions.env` pattern
entries](/concepts/tasks#permissions-env-pattern-entries-forward-a-family-of-host-vars).
:::

## Using Podman instead of Docker

To use Podman, change the runtime:

```yaml
runtime: podman
```

Everything else stays the same -- `docker.image`, `docker.ports`,
`docker.volumes`, and `docker.build` all work identically with Podman. dicode
automatically uses the `podman` CLI instead of `docker`.

### Example

```yaml
apiVersion: dicode/v1
kind: Task
name: Hello Podman
description: Builds a custom Python image and prints system info
runtime: podman

trigger:
  manual: true

docker:
  build:
    dockerfile: Dockerfile
```

## Template variable expansion

Several `docker:` fields support `${VAR}` substitution, resolved at task-load
time. The most useful built-in is `${TASK_DIR}`, which is the absolute path to
the task's own directory.

::: tip Which fields expand `${VAR}`?
`docker.command`, `docker.entrypoint`, `docker.working_dir`,
`docker.build.context`, `docker.build.dockerfile`, and `docker.volumes` all
expand template variables.

`docker.image`, `docker.ports`, and `docker.env_vars` do **not** expand
variables — their values are taken literally.
:::

::: warning Daemon env vars are not a fallback
The expansion policy is `envFallback: false`. Built-in variables such as
`${TASK_DIR}` and `${DATADIR}` are resolved, but daemon process environment
variables are **not** accessible as a fallback. An unrecognised `${VAR}`
reference is left as-is rather than replaced with a daemon env var value. To
pass host env vars into a container, use `permissions.env` and `docker.env_vars`.
:::

### Example: Dockerfile build using `${TASK_DIR}`

```yaml
apiVersion: dicode/v1
kind: Task
name: App Builder
description: Builds from the task directory and mounts local config
runtime: docker

trigger:
  manual: true

docker:
  build:
    context: "${TASK_DIR}"
    dockerfile: "${TASK_DIR}/Dockerfile"
  working_dir: /app
  volumes:
    - "${TASK_DIR}/config:/app/config:ro"
  command: ["python", "main.py"]
```

This guarantees the build context and Dockerfile paths resolve to the correct
absolute location regardless of how or where dicode is run.

## Configuration reference

The full set of `docker` fields available in task.yaml:

| Field | `${VAR}` expansion | Description |
| --- | --- | --- |
| `docker.image` | no | Container image to use (e.g. `nginx:alpine`) |
| `docker.build.dockerfile` | **yes** | Path to Dockerfile, relative to the task directory |
| `docker.build.context` | **yes** | Build context directory, relative to the task directory |
| `docker.command` | **yes** | Override image CMD |
| `docker.entrypoint` | **yes** | Override image ENTRYPOINT |
| `docker.working_dir` | **yes** | Container working directory |
| `docker.volumes` | **yes** | List of volume mounts (`host:container[:options]`) |
| `docker.ports` | no | List of port mappings (`host:container`) |
| `docker.pull_policy` | no | When to pull: `always`, `missing`, or `never` |
| `docker.env_vars` | no | Additional environment variables to pass to the container. `permissions.env` (`secret:`/`from:`/`value:` entries) is also merged into the container env; on a name collision, the resolved `permissions.env` value wins over the literal `docker.env_vars` value. See [Example 3](#example-3-injecting-a-secret-as-a-container-env-var) above. |

When `docker.build` is set, `docker.image` is ignored -- dicode builds and
tags the image automatically.
