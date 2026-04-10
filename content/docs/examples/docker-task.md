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
  code. Non-zero exits are treated as failures and trigger `notify.on_failure`
  if configured.

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

## Configuration reference

The full set of `docker` fields available in task.yaml:

| Field | Description |
| --- | --- |
| `docker.image` | Container image to use (e.g. `nginx:alpine`) |
| `docker.build.dockerfile` | Path to Dockerfile, relative to the task directory |
| `docker.ports` | List of port mappings (`host:container`) |
| `docker.volumes` | List of volume mounts (`host:container[:options]`) |
| `docker.pull_policy` | When to pull: `always`, `missing`, or `never` |
| `docker.env` | Additional environment variables to pass to the container |

When `docker.build` is set, `docker.image` is ignored -- dicode builds and
tags the image automatically.
