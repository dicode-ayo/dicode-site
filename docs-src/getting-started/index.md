# Installation & Quickstart

dicode is a single Go binary that runs as a background daemon (`dicoded`) with a thin CLI (`dicode`) that auto-starts the daemon on first use. No containers, no infrastructure, no accounts required.

## Install

Download the latest release for your platform from [GitHub Releases](https://github.com/dicode-ayo/dicode-core/releases).

::: code-group

```sh [Linux (amd64)]
curl -Lo dicode.tar.gz https://github.com/dicode-ayo/dicode-core/releases/latest/download/dicode-linux-amd64.tar.gz
tar xzf dicode.tar.gz
sudo mv dicode dicoded /usr/local/bin/
```

```sh [macOS (Apple Silicon)]
curl -Lo dicode.tar.gz https://github.com/dicode-ayo/dicode-core/releases/latest/download/dicode-darwin-arm64.tar.gz
tar xzf dicode.tar.gz
sudo mv dicode dicoded /usr/local/bin/
```

```sh [macOS (Intel)]
curl -Lo dicode.tar.gz https://github.com/dicode-ayo/dicode-core/releases/latest/download/dicode-darwin-amd64.tar.gz
tar xzf dicode.tar.gz
sudo mv dicode dicoded /usr/local/bin/
```

:::

Verify the installation:

```sh
dicode version
```

## Start the daemon

You do not need to start the daemon manually. Any CLI command auto-starts `dicoded` in the background if it is not already running:

```sh
dicode list
```

The first run creates `~/.dicode/` with a default `dicode.yaml` config file and a SQLite database.

## Local-only mode (no git needed)

The simplest setup points dicode at a local directory of tasks. Create a minimal config:

```yaml
# ~/.dicode/dicode.yaml
sources:
  - type: local
    path: ~/dicode-tasks/taskset.yaml
```

Then create the tasks directory and a `taskset.yaml`:

```sh
mkdir -p ~/dicode-tasks
```

```yaml
# ~/dicode-tasks/taskset.yaml
apiVersion: dicode/v1
kind: TaskSet
name: my-tasks
tasks:
  - hello-cron
```

Each entry in `tasks` is a subdirectory name containing a `task.yaml` and a script file. See [Your First Task](./first-task) for a complete walkthrough.

The daemon watches local sources with `fsnotify` and picks up changes within milliseconds -- no restart needed.

## Add a git source (optional)

To pull tasks from a remote git repository, add a git source to your config:

```yaml
# ~/.dicode/dicode.yaml
sources:
  - type: git
    url: https://github.com/your-org/your-tasks.git
    branch: main
    poll_interval: 30s
    auth:
      type: token
      token_env: GITHUB_TOKEN
```

The daemon clones the repo, polls for changes at the configured interval, and reconciles tasks automatically. Private repos require a token -- set the environment variable referenced by `token_env`.

## CLI commands

| Command | Description |
| --- | --- |
| `dicode run <task-id> [key=value ...]` | Trigger a task and wait for the result. Pass params as `key=value` pairs. |
| `dicode list` | List all registered tasks with their trigger type and last status. |
| `dicode logs <run-id>` | Show log output for a specific run. |
| `dicode status [task-id]` | Show daemon health, or the latest run for a specific task. |
| `dicode secrets list` | List all secret keys in the local store. |
| `dicode secrets set <key> <value>` | Store a secret value. |
| `dicode secrets delete <key>` | Delete a secret. |
| `dicode version` | Print the dicode version. |

## Next steps

- [Your First Task](./first-task) -- create a cron task from scratch
- [Configuration Reference](./configuration) -- full `dicode.yaml` reference
- [Runtimes](/concepts/runtimes) -- Deno, Python, Docker, and Podman
- [Triggers](/concepts/triggers) -- cron, webhook, manual, chain, and daemon
- [SDK Globals](/concepts/sdk) -- `params`, `kv`, `output`, and more
