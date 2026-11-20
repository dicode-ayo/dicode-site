# Task Sharing & Search

Tasks are folders in git repos. Sharing is built into the model — no special packaging, no proprietary format.

## How sharing works

Any task from any git repo can be referenced via a TaskSet entry:

```yaml
# your taskset.yaml
apiVersion: dicode/v1
kind: TaskSet
spec:
  entries:
    # Your own tasks
    my-digest:
      ref: { path: ./tasks/my-digest }

    # Someone else's task — just a git URL
    slack-alerts:
      ref:
        url: https://github.com/someone/dicode-slack-alerts
        branch: main

    # Override params for your environment
    uptime-monitor:
      ref:
        url: https://github.com/dicode-community/tasks
        path: monitoring/uptime
      overrides:
        params:
          check_url: "https://api.myapp.com/health"
          slack_channel: "#ops"
```

That's it. `dicode` clones the repo, loads the task, and starts running it. No install command, no registry account, no build step.

## Searching for tasks

```bash
dicode task search <query...> [--taskset <git-url-or-path>[@ref]]... [--config PATH] [--json]
```

`task search` reads TaskSets directly. It needs no running daemon and never starts one. `--` ends flag parsing, so a query word that starts with `-` can follow it: `dicode task search -- -nightly`.

```bash
$ dicode task search uptime --taskset https://github.com/acme/dicode-tasks.git@v1.2.0
ID                                       NAME                           DESCRIPTION
dicode-tasks/uptime-ping                 Uptime Ping                    HTTP health checks with Slack alerting
```

### Matching

The query is split into words. A task matches when **every** word appears, case-insensitively, somewhere in its full id (`<taskset>/<task-id>`), its `name`, or its `description`. Different words can match different fields. Tags are not searched. Names and descriptions are matched after entry `overrides` are applied, so they are the same values the daemon shows.

### What gets searched

- **Without `--taskset`**, every `ref` source under `spec.entries` in `dicode.yaml` is searched, local and git (`inline:` entries are not), with its `overrides` applied. This includes the `ai-scratch` source at `<data_dir>/ai-tasks/taskset.yaml`, which is added automatically unless `dicode.yaml` defines an `ai-scratch` entry of its own. Use `--config PATH` to read a different file; the default is `./dicode.yaml`. The config must be a regular file. On Unix it must also be owned by the user running the command, even when that user is root, and a symlinked `dicode.yaml` is refused (it is opened with `O_NOFOLLOW`). Other platforms check only that it is a regular file. Git sources use the same `ref.auth.token_env`, `source_security.allowed_token_envs` and `source_security.allow_internal_hosts` settings the daemon does. A relative `ref.path` resolves against the current working directory, as it does for the daemon, so run `task search` from the directory you start the daemon in.
- **`--taskset <src>[@ref]`** searches the named TaskSets **instead of** the configured ones. It can be repeated. Use it to browse a remote or community TaskSet before you add it. `<src>` is a git remote if it contains `://`, starts with `http:`, `https:` or `ssh:` (so `https:foo` is a remote, not a path), or is in SCP form (`user@host:path`, where `host` has only letters, digits, `.`, `-` and `_`, as in `git@github.com:org/repo.git`). A remote must use `https://`, `http://` or `ssh://`; any other scheme, such as `file://` or `git://`, is an error. Any other value is a local path to a `taskset.yaml` or to the directory that holds one. For a git remote, `taskset.yaml` is read from the repo root. `@ref` is only parsed on a git remote; on a local path an `@` stays part of the path, unless the value is in SCP form and so is treated as a remote. On a remote, `@ref` names a branch or a tag: the branch is tried first, then a tag with that name. Without `@ref`, the `main` branch is used, or the remote's default (`HEAD`) branch if it has no `main`.

A `--taskset` is treated as untrusted, including a local path. No `token_env` token is sent for it, and any `ref.auth.token_env` declared in the TaskSet's own entries is ignored, so a TaskSet you are only browsing can't get your tokens sent to a host it names. SSH is different: an `ssh://` or SCP remote, including a nested ref inside the TaskSet, is cloned with go-git's default SSH auth, which uses your ssh-agent and offers its identities to that host. Browse untrusted TaskSets over `https://`. Internal hosts are refused by the default SSRF guard.

Git TaskSets are cloned into a temporary `dicode-task-search-*` directory under `$TMPDIR`, which is deleted when the command exits or is interrupted with Ctrl-C. A `SIGTERM` or `SIGKILL` can leave it behind. Your sources are never written to, with one exception: without `--taskset`, loading the config creates `<data_dir>/ai-tasks/` and a `taskset.yaml` with no entries inside it if they are missing, as the daemon does, unless `dicode.yaml` defines its own `ai-scratch` entry. An existing file is never overwritten. Any credentials in a URL's userinfo are stripped from the URLs and errors the command prints.

### Output

The output has a header row and one row per task, sorted by id:

```
ID                                       NAME                           DESCRIPTION
community/slack-digest                   Slack Daily Digest             Posts a digest of the day's messages to a channel.
```

`ID` is `<taskset>/<task-id>`. For a configured source, the prefix is the `dicode.yaml` entry key, which is also the id the daemon registers. For a `--taskset`, the prefix is the last element of the URL path or local path, with any `.git`, `.yaml` or `.yml` suffix removed. If that leaves `taskset`, the element before it is used instead, so `.../community/taskset.yaml` becomes `community`. If there is no element before it, or nothing is left, a remote uses its host name and a local path uses `taskset`. If two `--taskset` values would get the same prefix, later ones get `-2`, `-3` and so on, in flag order. Descriptions are cut to one line of 60 characters, and an empty name or description is shown as `-`.

Without `--json`, if nothing matches, stdout is empty and `no tasks match "<query>"` is written to stderr. In either format, the exit status is `0` only if every TaskSet was searched (see [Exit status](#exit-status)).

`--json` prints a JSON array instead, or `[]` if nothing matches, with no `no tasks match` message. Warnings and TaskSet failures still go to stderr. Every object has the same keys, set to an empty string when the value is unknown:

| Key | Value |
|---|---|
| `source` | The TaskSet label used as the id prefix |
| `id` | The namespaced task id |
| `name` | The resolved `name` |
| `description` | The resolved `description`, in full |
| `location` | The TaskSet's git URL (credentials stripped) or absolute local path |
| `ref` | The branch or tag that was searched (git only) |
| `commit` | The HEAD commit of the root TaskSet's repo (git only). For a task pulled in from another repo by a nested ref, this is still the root TaskSet's commit |

### Exit status

The exit status is `0` on success, including when nothing matches. It is non-zero for bad usage (no query, an unknown flag, a flag with no value), a missing or untrusted config, or a TaskSet that could not be fetched or parsed. When some TaskSets fail, the results from the ones that worked are still printed, and each failure is reported on stderr. A single task entry that fails to load inside a TaskSet is printed as a warning on stderr and does not change the exit status.

## Adding a task you found

Once `task search` has found a TaskSet you want, add it to `dicode.yaml` as a git source under `spec.entries`. Pin it with `tag:`, or track a branch with `branch:` (polled every sync):

```yaml
# dicode.yaml
spec:
  entries:
    dicode-tasks:
      ref:
        url: https://github.com/acme/dicode-tasks.git
        tag: v1.2.0          # or branch: main
        path: taskset.yaml
      overrides:
        entries:
          uptime-ping:
            params:
              check_url: "https://api.myapp.com/health"
```

The entry key (`dicode-tasks` here) sets the namespace, so the task registers as `dicode-tasks/uptime-ping`. It matches the id `task search --taskset` printed only when the key equals the prefix that search showed (see [Output](#output) for how that prefix is derived). The daemon reads `dicode.yaml` only at startup, so restart it after a hand edit. To add a source without a restart, use the web UI's source settings or `POST /api/settings/sources`. Either one starts the source right away and saves the entry to `dicode.yaml`. It takes a local path, or a git URL (plus `branch`, `tag` and `token_env`) with `taskset.yaml` at the repo root, since it has no in-repo `path`. It does not take `overrides`. Saving the config in the web UI's raw editor applies `overrides` to sources that are already running, but it does not start a newly added entry. Tasks from a new source still go through the [approval gate](./approval) before they run, unless the gate is off (`approval.enabled: false`), the source is trusted (`approval.sources.<key>.trust: always`) or the task is (`approval.tasks.<id>.trust: always`). See [Sources & TaskSets](./sources) for every `ref` field and for how overrides cascade.

### Installing a task (planned) {#installing-a-task}

::: info Planned
`dicode task install` does not exist yet. It is planned as a one-command shortcut that writes the `dicode.yaml` entry above for you, with flags for param overrides. Until it ships, add the entry by hand. Progress is tracked in [dicode-ayo/dicode-core#118](https://github.com/dicode-ayo/dicode-core/issues/118).
:::

## Task registry as a TaskSet (planned) {#task-registry-as-a-taskset}

::: info Planned
A community task registry does not exist yet. The plan is for it to be an ordinary TaskSet that lists community task repos, in the same format as everything else, so it can be searched with `--taskset` and added like any other source. `dicode task search` does **not** query a registry by default. It only searches the TaskSets in your `dicode.yaml` or the ones you name with `--taskset`.
:::

## Overrides and customization

TaskSets support a 3-level override cascade:

1. **Base task spec** — the original `task.yaml`
2. **TaskSet defaults** — shared config across all entries
3. **Per-entry overrides** — customize params, timeout, env for your environment

```yaml
spec:
  defaults:
    timeout: 5m
  entries:
    slack-alerts:
      ref: { url: https://github.com/someone/tasks }
      overrides:
        timeout: 2m  # override the default for this task
        params:
          channel: "#my-team"
```

## Contributing a task

To share a task with the community:

1. Create a public git repo with your task folder (task.yaml + task.ts/task.py) and a `taskset.yaml` at the repo root that lists it
2. Share the repo URL. Anyone can browse it with `dicode task search <query> --taskset <url>` and add it as a source in their `dicode.yaml`
3. That's it — no packaging, no publishing step

Listing your repo in a community registry TaskSet will be possible once the [registry](#task-registry-as-a-taskset) exists.

## Running on multiple machines

Point multiple dicode daemons at the same git repo. Each daemon is independent — it reconciles the repo on its own, with no cross-daemon coordination, no shared cluster state, and no orchestration layer:

- **Home server** — runs monitoring, backups, media processing (24/7 tasks)
- **Laptop** — runs dev tasks, webhook receivers, interactive UIs
- **VPS** — runs public webhook endpoints, scheduled jobs
- **Raspberry Pi** — runs IoT data collection, sensor polling

Each daemon picks up a `git push` within its poll interval (30s default, or instantly via git webhook). Use separate TaskSet entry points or env-based overrides to control which tasks run where.
