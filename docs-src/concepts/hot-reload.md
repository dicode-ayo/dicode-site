# Hot Reload & Dev Workflow

dicode detects file changes in milliseconds and reloads tasks without any restart or deploy step.

## Local source — 100ms reload

When using a local task directory, dicode watches for file changes via `fsnotify`:

```
[10:00:01] task/slack-digest registered (hash: a1b2c3)
[10:00:14] file changed: tasks/slack-digest/task.ts
[10:00:14] task/slack-digest updated (hash: d4e5f6)  ← 100ms
```

The reconciler computes a content hash of `task.yaml` + `task.ts`. If the hash changed, the task is re-registered instantly:

- **Cron/manual tasks** — next trigger fires with new code
- **Daemon tasks** — process restarts automatically with updated code
- **Webhook tasks** — next incoming request uses new handler

No build step. No deploy command. Save and it's live.

## Git source — under 1 second

With a git source and a GitHub push webhook configured:

1. You push to the repo
2. GitHub sends a webhook to your relay URL
3. dicode pulls the latest commit
4. Changed tasks are re-registered

Total latency: under 1 second from push to live.

Without a webhook, dicode polls every 30 seconds (configurable via `poll_interval`).

## Dev mode for TaskSets

TaskSet sources support dev mode — override a git reference with a local path for rapid iteration:

```bash
# Switch to local dev
dicode source dev my-taskset --local-path ~/code/my-tasks

# Back to git
dicode source dev my-taskset --disable
```

In dev mode, the local path is watched with fsnotify (100ms), giving you the speed of local development with the structure of TaskSets.

## How change detection works

1. **Load** — read `task.yaml` + script file from the task directory
2. **Hash** — SHA-256 of the concatenated file contents
3. **Compare** — if hash differs from the registered version, emit an update event
4. **Reconcile** — registry re-registers the task, trigger engine reschedules

For TaskSet sources, the hash is computed from the fully-resolved spec (after override cascade), so changing an override in a parent TaskSet also triggers a reload.

## ArgoCD for everything outside Kubernetes

If you've used ArgoCD or Flux for Kubernetes, dicode's model will feel familiar:

| | ArgoCD | dicode |
|---|---|---|
| **Watches** | Git repos for K8s manifests | Git repos for task.yaml files |
| **Reconciles** | Desired vs actual cluster state | Desired vs actual task registry |
| **Drift detection** | Continuous sync | Content-hash comparison + auto-reload |
| **Deploy** | Apply manifests to K8s API | Re-register task, reschedule triggers |
| **Requires** | Kubernetes cluster | One binary |

The same declarative, git-driven, reconciliation-based model — without the cluster. Your git repo IS the desired state. What's in git is what's running. Always.
