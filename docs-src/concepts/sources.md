# Sources & TaskSets

Sources tell dicode where to find tasks. A source can be a local directory on disk or a remote Git repository. TaskSets provide a hierarchical composition model for organizing tasks across multiple repositories with namespace-scoped IDs and override cascades.

## Local source

A local source watches a directory on disk for task changes.

```yaml
# dicode.yaml
sources:
  - type: local
    path: /home/user/tasks
```

- **fsnotify**: File changes are detected via OS filesystem notifications (fsnotify) with approximately 150ms debounce to handle editors that write via tmp-rename.
- **Initial scan**: On startup, all task directories are scanned and registered.
- **Hot reload**: Adding, modifying, or removing a task directory is detected in real time -- no restart needed.

---

## Git source

A git source clones a remote repository and polls it for changes on a configurable interval.

```yaml
# dicode.yaml
sources:
  - type: git
    url: https://github.com/myorg/my-tasks.git
    branch: main                  # default: main
    poll_interval: 30s            # default: 30s
    auth:
      token_env: GITHUB_TOKEN    # env var holding a PAT or access token
```

- **Clone on startup**: The repository is cloned to a local cache directory under `~/.dicode/repos/`.
- **Polling**: dicode pulls the branch at the configured interval and diffs the snapshot to detect added, updated, or removed tasks.
- **Token auth**: For private repositories, set `auth.token_env` to the name of an environment variable containing an HTTP Bearer / Basic-auth token (e.g. a GitHub PAT).

---

## TaskSets

TaskSets are hierarchical YAML manifests that compose tasks from multiple sources with namespace scoping, override cascades, and deduplication. They are the recommended way to manage tasks at scale.

### Structure

A TaskSet file has `kind: TaskSet` and contains named entries. Each entry can reference a local task directory, a git repository, or another nested TaskSet:

```yaml
apiVersion: dicode/v1
kind: TaskSet
metadata:
  name: my-taskset
spec:
  defaults:
    timeout: 30s
    env:
      - name: LOG_LEVEL
        value: info
  entries:
    deploy-backend:
      ref:
        path: ./tasks/deploy-backend
    deploy-frontend:
      ref:
        url: https://github.com/myorg/frontend-deploy.git
        path: taskset.yaml
        branch: main
      overrides:
        params:
          environment: staging
    monitoring:
      ref:
        url: https://github.com/myorg/monitoring-tasks.git
        path: taskset.yaml
```

### Namespace-scoped IDs

Tasks within a TaskSet get namespaced IDs based on the entry hierarchy. For example, if the root TaskSet is named `infra` and has an entry `deploy-backend`, the task ID becomes `infra/deploy-backend`. Nested TaskSets add further segments: `infra/monitoring/check-health`.

This prevents name collisions across independently maintained task repositories.

### Override precedence

TaskSets apply overrides in a three-level cascade (lowest to highest priority):

1. **task.yaml base spec** -- The original task definition as written by the author.
2. **TaskSet defaults** -- The `spec.defaults` block of the TaskSet containing the entry. Applied to all entries in the set.
3. **Per-entry overrides** -- The `overrides` block on the specific entry. Highest priority, wins over everything.

For example:

```yaml
spec:
  defaults:                       # Level 2: applied to all entries
    timeout: 60s
    env:
      - name: ENV
        value: staging
  entries:
    my-task:
      ref:
        path: ./tasks/my-task     # Level 1: task.yaml base
      overrides:                   # Level 3: per-entry, wins
        timeout: 120s
        params:
          limit: "50"
```

### What can be overridden

The override system can patch these fields without modifying the original task.yaml:

- `name`, `description`
- `trigger` (cron, webhook, manual, chain, daemon, restart)
- `params` (add new params or change defaults of existing ones)
- `env` (add or replace env entries)
- `net` (replace network access list)
- `timeout`
- `runtime`
- `notify` (on_success, on_failure)
- `dicode` permissions (tasks, mcp, list_tasks, get_runs, secrets_write)

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

### Git refs in entries

Entries can reference tasks in remote Git repositories:

```yaml
entries:
  deploy:
    ref:
      url: https://github.com/myorg/deploy-tasks.git
      path: tasks/deploy           # path within the repo
      branch: main
      poll_interval: 60s
      auth:
        token_env: GITHUB_TOKEN
```

---

## Dev mode

TaskSet sources support a **dev mode** that temporarily swaps a remote git source for a local directory. This lets you develop and test changes to tasks without pushing to a remote repository.

### Activating dev mode

Via the REST API:

```bash
curl -X PATCH http://localhost:8080/api/sources/my-source/dev \
  -H 'Content-Type: application/json' \
  -d '{"enabled": true, "local_path": "/home/user/my-local-tasks/taskset.yaml"}'
```

Via MCP (for AI agent integrations):

```
switch_dev_mode(source="my-source", enabled=true, local_path="/home/user/my-local-tasks")
```

### Deactivating dev mode

```bash
curl -X PATCH http://localhost:8080/api/sources/my-source/dev \
  -H 'Content-Type: application/json' \
  -d '{"enabled": false}'
```

When dev mode is deactivated, the source reverts to its configured git remote.

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
