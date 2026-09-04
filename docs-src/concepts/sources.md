# Sources & TaskSets

dicode watches one or more **sources** for task files and reconciles them automatically. Add a file, the task is live. Delete a file, it stops. No restart needed.

`dicode.yaml` is itself a **root TaskSet**: every source is declared as an entry under `spec.entries`, where the key is the namespace and the `ref` block points at a `taskset.yaml` (local or git). The same parent-override mechanism that operators use inside a `taskset.yaml` works at the top level too, so you can disable or patch a built-in task directly in `dicode.yaml` without forking the taskset.

::: tip First-run setup
You normally don't write `dicode.yaml` by hand. The first-launch wizard generates it for you with curated tasksets pre-wired. See the [Quickstart](../getting-started/) for the wizard surfaces; this page documents the schema so you can edit the result.
:::

---

## dicode.yaml as a root TaskSet

```yaml
# dicode.yaml
spec:
  entries:
    buildin:
      ref:
        url: https://github.com/dicode-ayo/dicode-buildin
        branch: main
        path: taskset.yaml
        poll_interval: 30s
      overrides:
        entries:
          relay-client:
            enabled: false       # disable one buildin task without forking the set
    examples:
      ref:
        url: https://github.com/dicode-ayo/dicode-core
        branch: main
        path: tasks/examples/taskset.yaml
        poll_interval: 5m
        auth:
          token_env: GITHUB_TOKEN
```

Each entry key becomes the namespace under which the referenced taskset's tasks are registered. Both sources contribute to the same registry — task IDs must be unique across all sources.

::: tip `buildin` is its own git repo
`buildin` resolves over git, from [dicode-ayo/dicode-buildin](https://github.com/dicode-ayo/dicode-buildin), rather than a local path bundled with dicode. The daemon polls it (`poll_interval`) and reconciles changes without a restart, so built-in tasks update independently of your `dicode` binary version.
:::

### Field reference for `spec.entries.<name>.ref`

| Field | Default | Description |
|---|---|---|
| `path` | required (local) | Absolute path to `taskset.yaml`; `${CONFIGDIR}` and `${HOME}` are expanded, and a leading `~/` resolves to the user's home directory |
| `url` | required (git) | HTTPS or SSH git URL |
| `branch` | `main` | Branch to track (git only) |
| `poll_interval` | `30s` | How often to fetch (git only) |
| `auth.token_env` | | Env var holding a personal access token |
| `auth.ssh_key` | | Path to an SSH private key |
| `watch` | `true` | Enable fsnotify live reload (local refs) |
| `dev_ref` | | Substitute ref when [dev mode](#dev-mode) is active |

### Field reference for `spec.entries.<name>` (entry-level)

| Field | Default | Description |
|---|---|---|
| `ref` | required | Source descriptor (see above) |
| `enabled` | `true` | Disable without deleting; one-liner shortcut for `overrides.enabled` |
| `tags` | `[]` | UI grouping labels |
| `overrides` | | Patch the referenced taskset (see [Override precedence](#override-precedence)) |

---

## TaskSet sources

A TaskSet source uses a `taskset.yaml` file as its entry point. Tasks are composed hierarchically — a TaskSet can reference other TaskSets, allowing large task trees to be built from smaller ones (like ArgoCD App-of-Apps).

```yaml
# taskset.yaml — entry point for one source
apiVersion: dicode/v1
kind: TaskSet
metadata:
  name: infra
spec:
  defaults:
    timeout: 30m
  entries:
    deploy-backend:
      ref:
        path: ./backend/task.yaml
      overrides:
        timeout: 5m
    platform:
      ref:
        path: ./platform/taskset.yaml   # nested TaskSet — namespace: infra/platform
```

Each task file declares its kind:

```yaml
apiVersion: dicode/v1
kind: Task
name: Deploy Backend
trigger:
  manual: true
```

### Namespace-scoped IDs

Task IDs are built from the path of TaskSet names:

- Root entry `buildin` + inner entry `relay-client` → ID `buildin/relay-client`
- Nested entry `buildin` > `platform` + inner entry `nginx-start` → ID `buildin/platform/nginx-start`

This prevents collisions across independently maintained task repositories.

### Override precedence

Overrides apply in a three-level cascade (lowest to highest):

1. **`task.yaml` base values** — the original task definition.
2. **TaskSet `spec.defaults`** — applied to every entry in the set.
3. **Per-entry `overrides`** — parent-entry patch merged with local entry overrides; leaf wins.

::: warning Deprecated
`kind: Config` `spec.defaults` and `overrides.defaults` from parent TaskSets are no longer applied to the override stack. Migrate shared defaults to the `defaults:` block in `dicode.yaml`.
:::

### What can be overridden

The override system can patch these fields without modifying the original `task.yaml`:

- `name`, `description`
- `trigger` (cron, webhook, manual, chain, daemon, restart)
- `params` (add new params or change defaults of existing ones)
- `env` (add or replace env entries)
- `net` (replace network access list)
- `timeout`
- `runtime`
- `on_failure_chain` (override which task fires on failure, including notifications)
- `dicode` permissions (`tasks`, `mcp`, `list_tasks`, `get_runs`, `secrets_write`)
- `enabled` (see below)

### Disabling an entry

Set `enabled: false` to disable a task without deleting its definition. Disabled tasks remain visible in the API (with `enabled: false`) and the registry, but are not scheduled (no cron), not spawned (no daemon), and not routed (no webhook).

```yaml
spec:
  entries:
    relay-client:
      enabled: false        # one-liner shortcut; default is true when omitted
      ref:
        path: ./relay-client/task.yaml
```

The longer nested form (`overrides.enabled: false`) is equivalent and still supported; setting both is a parse error.

A parent TaskSet (or `dicode.yaml`) can also flip an entry's enabled state via its own `overrides.entries.<key>.enabled`. This lets a higher-level operator disable a built-in task without forking the taskset. Parent-level override wins over child-level.

You can also toggle `enabled` at runtime via the dashboard or the [`PATCH /api/tasks/{id}/overrides`](./tasks#enable-disable) endpoint — runtime overrides are persisted to `dicode.yaml`.

### Nested entry overrides

Parent TaskSets can patch specific tasks inside nested TaskSets using `overrides.entries`:

```yaml
entries:
  monitoring:
    ref:
      url: https://github.com/myorg/monitoring.git
      path: taskset.yaml
    overrides:
      entries:
        health-check:             # patch a specific task inside the nested set
          timeout: 120s
          params:
            endpoint: https://api.example.com
```

---

## Multiple sources

Configure multiple sources by adding entries to `spec.entries`. Each entry key is the namespace:

```yaml
spec:
  entries:
    shared:
      ref:
        url: https://github.com/acme/tasks
        branch: main
    dev:
      ref:
        path: ~/tasks-dev
        watch: true
```

Both sources contribute tasks to the same registry. Task IDs must be unique across all sources.

---

## Reconciler

The reconciler is the component that consumes events from all sources and keeps the task registry in sync.

**Event types:**

| Kind | Trigger | Registry action |
|---|---|---|
| `added` | New task folder detected | Register task (load spec, add to in-memory map, schedule triggers) |
| `updated` | Existing task changed | Re-register task (reload spec, reschedule) |
| `removed` | Task folder deleted | Unregister task (cancel triggers, remove from map) |

**Fan-in:** the reconciler fans in channels from all sources using a single goroutine. Events are processed sequentially to avoid registry races.

**Error handling:**

- If a task's `task.yaml` fails to resolve, parse, or validate on `added` or `updated`, the entry's **prior (last-good) registration is carried forward unchanged** — no spurious `removed` event fires, so the task never looks like it silently vanished. The failure itself is tracked as first-class state instead of only being logged; see [Load failures](#load-failures) below.
- Source errors (git clone failure, auth failure) are logged and retried on the next poll cycle. The reconciler does not crash.

**Local sources** use `fsnotify` with ~150ms debounce to handle editors that write via tmp-rename. **Git sources** are cloned to a cache directory under `data_dir` and pulled at `poll_interval`.

### Load failures

A load failure is surfaced instead of silently dropping the task ([dicode-core#656](https://github.com/dicode-ayo/dicode-core/pull/656)). TaskSet sources expose their current failures via `Source.LoadFailures()`; the direct-load path (tasks registered outside a taskset) uses `Registry.SetLoadFailure` / `Registry.LoadFailures()`, with a failure cleared automatically whenever the task successfully `Register`s (or is `Unregister`ed) again — no separate "clear" call needed. Both feed the same API fields and dashboard signals below.

#### `GET /api/sources`

Each source in the response now includes:

| Field | Type | Description |
|---|---|---|
| `failed_count` | int | Number of task entries under this source currently failing to load |
| `failures` | array | One entry per failing task, with its ID and the load error |

A source can report `failed_count > 0` even when its most recent git pull succeeded — a bad `task.yaml` is an independent failure mode from a bad fetch/clone.

#### `GET /api/tasks`

Load failures are merged onto the task list:

- A task that was **previously registered** and is now failing to load keeps its existing row, with a new `load_error` field set to the parse/validation error.
- A task that has **never** registered (its `task.yaml` was broken from the first commit that introduced it) gets a **synthesized** minimal row — `kind: "LoadError"`, with `load_error` populated — so it's still discoverable via the API even though it has no prior good state to fall back on.

#### Dashboard signals

- The task list renders a red **"load error"** badge on any row with `load_error` set; its tooltip shows the parse error.
- A source group's status dot in the task list turns red when that source's `failed_count > 0`.
- The **Sources** page shows an equivalent status dot plus an **"N failed to load"** badge per source.

### Task ownership

Each task belongs to exactly one source. When a task is registered, the source ID is recorded. This matters for `dicode task commit` — it knows which source to commit to.

---

## Dev mode

TaskSet sources support a **dev mode** that temporarily swaps a source ref for a local directory. This lets you develop and test changes to tasks without pushing to a remote repository.

### Activating dev mode

Via the REST API:

```bash
curl -X PATCH http://localhost:8080/api/sources/buildin/dev \
  -H 'Content-Type: application/json' \
  -d '{"enabled": true, "local_path": "/tmp/my-dev-tasks/taskset.yaml"}'
```

Or toggle it from the **Sources** page in the web UI: enable dev mode, enter the local path.

### Deactivating dev mode

```bash
curl -X PATCH http://localhost:8080/api/sources/buildin/dev \
  -H 'Content-Type: application/json' \
  -d '{"enabled": false}'
```

Disabling dev mode immediately reverts to the original ref.

### Dev refs

Entries can declare a `dev_ref` that is automatically substituted when dev mode is active:

```yaml
entries:
  my-task:
    ref:
      url: https://github.com/myorg/tasks.git
      path: taskset.yaml
      dev_ref:
        path: /home/user/local-tasks/taskset.yaml
```

---

## Migration from the old `sources:` array

The top-level `sources:` array was removed in v0.1+ ([dicode-core#262](https://github.com/dicode-ayo/dicode-core/pull/262)). The format change is mechanical:

**Before:**

```yaml
sources:
  - name: buildin
    type: git
    url: https://github.com/dicode-ayo/dicode-buildin
    branch: main
    entry_path: taskset.yaml
    poll_interval: 30s
  - name: local-tasks
    type: local
    path: ~/dicode-tasks/taskset.yaml
    watch: true
  - name: examples
    type: git
    url: https://github.com/dicode-ayo/dicode-core
    branch: main
    entry_path: tasks/examples/taskset.yaml
    poll_interval: 5m
    auth:
      type: token
      token_env: GITHUB_TOKEN
```

**After:**

```yaml
spec:
  entries:
    buildin:
      ref:
        url: https://github.com/dicode-ayo/dicode-buildin
        branch: main
        path: taskset.yaml
        poll_interval: 30s
    local-tasks:
      ref:
        path: ~/dicode-tasks/taskset.yaml
        watch: true
    examples:
      ref:
        url: https://github.com/dicode-ayo/dicode-core
        branch: main
        path: tasks/examples/taskset.yaml
        poll_interval: 5m
        auth:
          token_env: GITHUB_TOKEN
```

**Field mapping:**

| Old `sources[]` field | New location |
|---|---|
| `name` | entry key (e.g. `buildin:`) |
| `type` | inferred: `url` present → git; `path` present → local |
| `path` | `ref.path` |
| `url` | `ref.url` |
| `branch` | `ref.branch` |
| `poll_interval` | `ref.poll_interval` |
| `auth.token_env` | `ref.auth.token_env` |
| `auth.ssh_key` | `ref.auth.ssh_key` |
| `watch` | `ref.watch` |
| `dev_ref` | `ref.dev_ref` |
| `tags` | `entry.tags` |

If you still have a `sources:` array in your `dicode.yaml`, the daemon will refuse to start and print an error pointing at this migration guide. See [dicode-core#261](https://github.com/dicode-ayo/dicode-core/issues/261).
