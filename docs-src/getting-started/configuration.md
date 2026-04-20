# Configuration Reference

The daemon reads its configuration from `~/.dicode/dicode.yaml`. A default file is created on first run. Restart the daemon after making changes (stop it and run any `dicode` command to auto-start).

## Full example

```yaml
# ~/.dicode/dicode.yaml

data_dir: ${HOME}/.dicode
log_level: info

sources:
  - type: local
    path: ~/dicode-tasks/taskset.yaml
    name: my-tasks
    watch: true

  - type: git
    url: https://github.com/your-org/tasks.git
    branch: main
    poll_interval: 30s
    name: team-tasks
    auth:
      type: token
      token_env: GITHUB_TOKEN

database:
  type: sqlite
  path: ${DATADIR}/data.db

secrets:
  providers:
    - type: local
    - type: env

notifications:
  on_failure: true
  on_success: false
  provider:
    type: ntfy
    url: https://ntfy.sh
    topic: dicode-alerts

server:
  port: 8080
  auth: false
  secret: ""
  allowed_origins: []
  trust_proxy: false
  mcp: true
  tray: true
  tls_cert: ""
  tls_key: ""

ai:
  model: gpt-4o
  api_key_env: OPENAI_API_KEY
  base_url: ""

defaults:
  on_failure_chain: ""

relay:
  enabled: false
  server_url: wss://relay.dicode.app

runtimes:
  deno:
    version: ""
  python:
    version: "0.7.3"
    disabled: false
```

## Sources

Sources define where tasks come from. Each source is either a local directory or a git repository.

### Local source

```yaml
sources:
  - type: local
    path: ~/dicode-tasks/taskset.yaml
    name: my-tasks          # optional; defaults to last path segment
    watch: true             # enable fsnotify file watching (default: true)
    entry_path: ""          # path to entry yaml file; defaults to "taskset.yaml"
    config_path: ""         # path to optional kind:Config yaml
```

Local sources use `fsnotify` to detect changes in near real-time. The `path` field should point to the `taskset.yaml` file or the directory containing it.

### Git source

```yaml
sources:
  - type: git
    url: https://github.com/your-org/tasks.git
    branch: main            # default: main
    poll_interval: 30s      # default: 30s
    name: team-tasks        # optional; defaults to last segment of URL
    entry_path: ""          # path within repo to taskset.yaml
    config_path: ""         # path within repo to dicode-config.yaml
    auth:
      type: token           # "token" or "ssh"
      token_env: GITHUB_TOKEN  # env var holding the access token
      # ssh_key: ~/.ssh/id_ed25519  # path to SSH key (for type: ssh)
    tags:
      - production
```

The daemon clones the repo into `data_dir`, polls for changes at the configured interval, and reconciles tasks automatically.

## Database

```yaml
database:
  type: sqlite              # "sqlite" (default), "postgres", or "mysql"
  path: ${DATADIR}/data.db  # SQLite file path
  url_env: DATABASE_URL     # env var holding DSN (postgres/mysql only)
```

SQLite is the default and requires no setup. The database stores run history, logs, KV data, and task metadata.

## Secrets

```yaml
secrets:
  providers:
    - type: local           # encrypted local store in data_dir
    - type: env             # read from environment variables
```

Providers are checked in order. The `local` provider stores secrets encrypted at rest in the data directory. Manage local secrets via the CLI:

```sh
dicode secrets set MY_API_KEY sk-abc123
dicode secrets list
dicode secrets delete MY_API_KEY
```

The `env` provider reads directly from environment variables.

## Notifications

```yaml
notifications:
  on_failure: true          # notify on task failure (default: true)
  on_success: false         # notify on task success (default: false)
  provider:
    type: ntfy              # "ntfy", "gotify", "pushover", or "telegram"
    url: https://ntfy.sh    # provider base URL
    topic: dicode-alerts    # ntfy topic / gotify app token / etc.
    token_env: NTFY_TOKEN   # env var holding auth token (optional)
```

Individual tasks can override notification settings with the `notify` field in `task.yaml`.

## Server

```yaml
server:
  port: 8080                # HTTP server port (default: 8080)
  auth: false               # enable passphrase auth wall (default: false)
  secret: ""                # passphrase override; leave empty to auto-generate on first boot
  allowed_origins: []       # CORS allowlist; empty = same-origin only
  trust_proxy: false        # trust X-Forwarded-For headers
  mcp: true                 # expose MCP endpoint at /mcp (default: true)
  tray: true                # enable system tray integration
  tls_cert: ""              # path to TLS certificate PEM (enables HTTPS)
  tls_key: ""               # path to TLS private key PEM
```

The server hosts the web UI, the REST API, and the MCP endpoint. When `mcp` is enabled, AI tools like Claude Code and Cursor can discover and call your tasks via the Model Context Protocol.

### Auth passphrase

When `server.auth: true`, the dashboard, REST API, and any webhook task declaring `trigger.auth: true` require a valid dicode session.

**Where the passphrase comes from**, in priority order:

1. `server.secret` — YAML override; highest priority
2. `kv["auth.passphrase"]` — stored in SQLite; managed via the dashboard or API
3. _(none)_ — on first boot with `server.auth: true` and no passphrase set, dicode auto-generates a cryptographically random 43-character passphrase and prints it to stdout **once**:

```
╔══════════════════════════════════════════════════════════════╗
║  dicode — auth passphrase generated                          ║
║                                                              ║
║  <43-char passphrase>                                        ║
║                                                              ║
║  Save this somewhere safe. You can change it any time at     ║
║  /security in the web UI (requires a valid session).         ║
╚══════════════════════════════════════════════════════════════╝
```

Save it somewhere safe — the banner is not shown again. The passphrase is immediately persisted in SQLite; subsequent restarts read it from the database.

**Rotating the passphrase.** Once you have a valid session, visit `/security` in the dashboard or `POST /api/auth/passphrase` with `{"current": "…", "passphrase": "…"}`. New passphrases must be at least 16 characters.

**Recovering a lost passphrase.** Delete the stored value and restart — dicode will auto-generate and print a new one:

```sh
sqlite3 <datadir>/dicode.db "DELETE FROM kv WHERE key='auth.passphrase';"
```

**YAML override behaviour.** When `server.secret` is set, the API refuses passphrase rotation requests with `409 Conflict` to prevent split-brain state between YAML and database. Remove the YAML field to manage the passphrase via the dashboard.

## AI

```yaml
ai:
  model: gpt-4o             # model name (default: gpt-4o)
  api_key_env: OPENAI_API_KEY  # env var holding the API key (default: OPENAI_API_KEY)
  base_url: ""              # OpenAI-compatible endpoint; leave empty for OpenAI
  api_key: ""               # direct API key (prefer api_key_env for security)
```

The AI config is used for task generation features. It supports any OpenAI-compatible API:

| Provider | `base_url` | `api_key_env` |
| --- | --- | --- |
| OpenAI | _(leave empty)_ | `OPENAI_API_KEY` |
| Anthropic | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| Ollama | `http://localhost:11434/v1` | _(leave empty)_ |

## Defaults

```yaml
defaults:
  on_failure_chain: notify-on-failure  # task ID to fire when any task fails
```

The `on_failure_chain` field specifies a task to trigger whenever another task fails. Individual tasks can override this with the `on_failure_chain` field in `task.yaml`, or disable it with an empty string.

## Relay

```yaml
relay:
  enabled: false                     # enable WebSocket relay client
  server_url: wss://relay.dicode.app # relay server URL
```

The relay allows your local dicode instance to receive webhooks from external services (GitHub, Slack, etc.) without port forwarding or a public IP. When enabled, the daemon connects outbound over WebSocket to the relay server and receives forwarded HTTP requests.

See [Webhook Relay](/concepts/relay) for details.

## Runtimes

```yaml
runtimes:
  deno:
    version: ""           # pin Deno version; empty = bundled default
    disabled: false        # disable this runtime entirely
  python:
    version: "0.7.3"      # pin uv version; empty = bundled default
    disabled: false
```

dicode manages runtime binaries automatically. Deno and uv (for Python) are downloaded and cached in the data directory on first use. Pin specific versions to ensure reproducibility across machines.

Available runtimes:

| Runtime | Script file | Version field controls |
| --- | --- | --- |
| `deno` | `task.ts` or `task.js` | Deno binary version |
| `python` | `task.py` | uv binary version |
| `docker` | _(none -- uses image)_ | N/A |
| `podman` | _(none -- uses image)_ | N/A |

## Config variables

Path fields in `dicode.yaml` support these template variables:

| Variable | Expands to |
| --- | --- |
| `${HOME}` | User home directory |
| `${DATADIR}` | Resolved `data_dir` value (default: `~/.dicode`) |
| `${CONFIGDIR}` | Directory containing the `dicode.yaml` file |
| `~/` | Shorthand for home directory (expanded before variables) |

Example:

```yaml
data_dir: ${HOME}/.dicode
database:
  path: ${DATADIR}/data.db
sources:
  - type: local
    path: ${CONFIGDIR}/tasks/my-tasks/taskset.yaml
```

## Environment variables

These environment variables affect daemon behavior:

| Variable | Description |
| --- | --- |
| `DICODE_DATA_DIR` | Override the data directory (default: `~/.dicode`). The CLI uses this to find the daemon socket. |
| `DICODE_MASTER_KEY` | Master encryption key for the local secrets store. If not set, a key is generated and stored in the data directory. |

## Next steps

- [Your First Task](./first-task) -- create and run a task
- [Tasks](/concepts/tasks) -- `task.yaml` reference
- [Sources & TaskSets](/concepts/sources) -- taskset.yaml and multi-source setups
- [Secrets](/concepts/secrets) -- secret providers and injection
