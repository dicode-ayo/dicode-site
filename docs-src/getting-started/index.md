# Installation & Quickstart

dicode is a single Go binary that runs as a background daemon (`dicoded`) with a thin CLI (`dicode`) that auto-starts the daemon on first use. No infrastructure, no accounts required. A multi-arch Docker image is also published if you'd rather run it as a container.

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

## Docker

The published image runs as a non-root user and exposes the dashboard on port 8080. SQLite state lives at `/data` inside the container; mount a volume there to persist runs and task registrations across restarts.

```sh
docker run -d --name dicode \
  -p 127.0.0.1:8080:8080 \
  -v dicode-data:/data \
  dicodeayo/dicode-core:latest
```

The dashboard binds to localhost only — drop the `127.0.0.1:` prefix
if you want it reachable from your LAN, but be aware the dashboard
authenticates with a single shared passphrase.

### docker-compose

```yaml
services:
  dicode:
    image: dicodeayo/dicode-core:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - dicode-data:/data
    # Keep secrets out of the compose file and out of version control.
    # Put DICODE_* vars (AI provider keys, etc.) in a sibling .env file.
    env_file: .env

volumes:
  dicode-data:
```

### Image registries

| Registry | Image |
| --- | --- |
| Docker Hub (primary) | `dicodeayo/dicode-core` |
| GHCR (mirror) | `ghcr.io/dicode-ayo/dicode-core` |

### Tags

- `:latest` -- most recent release
- `:X.Y.Z` -- exact release (recommended for production)
- `:X.Y` and `:X` -- track minor / major lines

Multi-arch (`linux/amd64` + `linux/arm64`) for every published tag.

## First launch: the setup wizard

You do not need to start the daemon manually, and you do not need to write `dicode.yaml` by hand. Any CLI command auto-starts `dicoded` in the background:

```sh
dicode list
```

When `~/.dicode/dicode.yaml` does not yet exist, the daemon runs a first-launch wizard, picks one of three surfaces based on your environment, generates a dashboard passphrase, and writes a ready-to-run config to `~/.dicode/dicode.yaml` (mode `0600` under a `0700` directory). The passphrase is printed **once** at the end of the wizard — copy it before closing the terminal. To change it later, edit `server.secret` in `dicode.yaml` and restart.

### Wizard surfaces

The surface is picked in this order:

1. The `DICODE_ONBOARDING` environment variable, if set to `silent`, `cli`, or `browser`, wins over everything below — set it for headless or scripted installs.
2. No TTY → **silent**.
3. TTY but no display → **CLI**.
4. TTY **and** a display → the daemon prompts `Set up in [b]rowser or [c]li? [b]` and you pick (default browser).

Display detection is loose by design: macOS and Windows always count as having a display; on Linux the daemon checks for `DISPLAY` or `WAYLAND_DISPLAY`.

| Surface | Selected when | What happens |
| --- | --- | --- |
| **Browser** | Desktop session, or you pick `b` at the prompt | The daemon listens on a random `127.0.0.1:<ephemeral>` port, prints a 6-digit PIN to your terminal, and opens your default browser at that URL. You type the PIN into the wizard, choose which tasksets to enable, then submit. The success page shows the passphrase with a copy button. After 5 wrong PIN attempts the session locks and you have to restart the daemon. |
| **CLI** | Interactive terminal, no display | Line-by-line prompts: enable each curated taskset (`Y/n`), confirm the local tasks dir (or type `skip`), then optionally `Configure advanced options (data dir, port)? [y/N]` — defaults to `N`. The passphrase prints when you finish. |
| **Silent** | Non-interactive (Docker, systemd, CI) | All default-on tasksets enabled, default paths applied, passphrase generated. The terminal prints a banner with the dashboard URL and the passphrase — the YAML itself is **not** echoed; it is written to disk. |

The PIN gate on the browser surface is a deliberate security control: the PIN is delivered to the user's controlling terminal (`/dev/tty`, falling back to stdout), never embedded in the wizard URL — which keeps it out of `argv` for `xdg-open`/`open`/`start.exe` and out of `/proc/<pid>/cmdline`.

### Curated tasksets

The wizard pre-wires three git-backed tasksets, all default-on:

| Taskset | What it gives you |
| --- | --- |
| **Built-in tasks** (`buildin`) | Tray icon, notifications, web UI, dicodai chat, alert. The daemon's standard inventory. |
| **Examples** (`examples`) | Copy-friendly samples — `hello-cron`, `github-stars`, `webhook-form`, `nginx-start`, and more. |
| **OAuth providers** (`auth`) | Zero-paste OAuth tasks for Google, GitHub, Slack, OpenRouter, Spotify, and more. |

The wizard also scaffolds a local tasks directory (default `~/dicode-tasks/`) with a starter `taskset.yaml` so you can drop your own tasks in next to the curated ones.

### Adding a custom local source after setup

The generated `dicode.yaml` already contains a `local:` entry pointing at `~/dicode-tasks`. To add a second local source — for example, a separate scratch directory — open `~/.dicode/dicode.yaml` and add another entry under `spec.entries`:

```yaml
# ~/.dicode/dicode.yaml
spec:
  entries:
    # ... wizard-generated entries above ...
    scratch:
      ref:
        path: ~/scratch-tasks/taskset.yaml
        watch: true
```

The matching `taskset.yaml` declares the tasks the directory contains:

```yaml
# ~/scratch-tasks/taskset.yaml
apiVersion: dicode/v1
kind: TaskSet
metadata:
  name: scratch
spec:
  entries:
    hello-cron:
      ref:
        path: ./hello-cron/task.yaml
```

Each `entry.ref.path` points at a `task.yaml` file inside its own subdirectory. See [Your First Task](./first-task) for a full walkthrough, and the [Configuration Reference](./configuration) for every supported field.

The daemon watches local sources with `fsnotify` and picks up changes within milliseconds — no restart needed.

### Adding a git source

To pull tasks from a remote git repository, add another entry under `spec.entries`:

```yaml
# ~/.dicode/dicode.yaml
spec:
  entries:
    team-tasks:
      ref:
        url: https://github.com/your-org/your-tasks.git
        branch: main
        poll_interval: 30s
        auth:
          token_env: GITHUB_TOKEN
```

The daemon clones the repo, polls for changes at the configured interval, and reconciles tasks automatically. Private repos require a token — set the environment variable referenced by `auth.token_env`.

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
