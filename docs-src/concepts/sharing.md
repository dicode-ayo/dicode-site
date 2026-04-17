# Task Sharing & Community Registry

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

## Task registry as a TaskSet

The community task registry is itself a TaskSet — the same format that powers everything else:

### Searching for tasks

```bash
$ dicode task search monitoring

  monitoring/uptime-ping     HTTP health checks with Slack alerting    github.com/dicode-ayo/task-uptime
  monitoring/ssl-expiry      SSL certificate expiration checker        github.com/user/task-ssl-check
  monitoring/dns-resolve     DNS resolution monitoring                 github.com/user/task-dns

  3 tasks found. Install with: dicode task install <name>
```

The search command fetches the registry TaskSet, walks its entries, and matches against names, descriptions, and tags.

### Installing a task

```bash
$ dicode task install monitoring/uptime-ping

Added monitoring/uptime-ping to taskset.yaml
  → github.com/dicode-ayo/task-uptime@main

Task registered. Next run: in 5 minutes (cron: */5 * * * *).
```

Under the hood, `install` adds a git ref entry to your local `taskset.yaml`:

```yaml
# What install added to your taskset.yaml
monitoring/uptime-ping:
  ref:
    url: https://github.com/dicode-ayo/task-uptime
    branch: main
```

The reconciler picks it up within seconds. You can then customize with overrides:

```bash
$ dicode task install monitoring/uptime-ping --set params.check_url=https://api.myapp.com/health
```

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

1. Create a public git repo with your task folder (task.yaml + task.ts/task.py)
2. Open a PR to add your repo URL to the community registry TaskSet
3. That's it — no packaging, no publishing step

## Multi-machine deployment

Point multiple dicode daemons at the same git repo:

- **Home server** — runs monitoring, backups, media processing (24/7 tasks)
- **Laptop** — runs dev tasks, webhook receivers, interactive UIs
- **VPS** — runs public webhook endpoints, scheduled jobs
- **Raspberry Pi** — runs IoT data collection, sensor polling

All from one git repo. Git push — all machines update within 30 seconds. Use separate TaskSet entry points or env-based overrides to control which tasks run where.
