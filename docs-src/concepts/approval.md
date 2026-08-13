# Task Approval Gate

The approval gate ensures that new or changed tasks in a watched git source cannot silently arm their triggers. Every non-builtin task must pass an explicit approval step before it can be scheduled, receive webhooks, or be fired manually.

## How it works

### Trust-on-change model

dicode watches git sources and reconciles tasks on every poll. Without the approval gate, a `git push` that introduces a new task (or edits an existing one) takes effect within the next reconcile cycle — quietly and automatically. With `approval.enabled: true`, the gate intercepts every registration and checks whether the task has been approved at its current content hash.

The decision is made once per `(task_id, content_hash)` pair:

1. The daemon computes the task's **content hash** (`sha256("dicode-approval-content-v2" || dir_hash || resolved_permissions_JSON)`) where `resolved_permissions_JSON` covers `Permissions`, `Runtime`, and `Trigger.WebhookAuth`.
2. It looks up the task ID in `dicode.lock`.
3. If the stored hash matches, the task re-arms immediately — no user action needed.
4. If there is no entry, or the hash has changed, the task is held **pending**.

Anything that changes what code runs or what the sandbox can do produces a new hash: editing any file in the task directory, changing the `task.yaml` manifest, or applying a taskset override that elevates net/fs/run/sys/dicode permissions, changes the runtime, or drops webhook auth.

### `dicode.lock`

`dicode.lock` is a daemon-owned YAML file written in the same directory as `dicode.yaml`. It maps task ID to `{hash, approved_at, approved_by, commit}` and is the source of truth for approval records.

```
~/.dicode/
  dicode.yaml    ← human-edited policy
  dicode.lock    ← daemon-managed approval records
```

Do not hand-edit `dicode.lock` while the daemon is running. The daemon reads and writes it atomically; concurrent edits will be overwritten on the next reconcile.

`commit` is an informational-only field — no gate decision reads it:

| | |
|---|---|
| Captured | At pend time, not re-read from HEAD when the task is later approved, so a recorded commit always matches the tree that produced the approved hash |
| Populated on | Every path that writes a lock entry, manual approval and auto-approve alike (trust-always source/task, gate disabled, bootstrap) |
| Left empty when | The task's directory isn't tracked by the resolved repository's HEAD — e.g. the source isn't a git repo, has no commits, or the task is a dir-less inline taskset entry |

A task directory that merely happens to sit inside an unrelated version-controlled folder does not get a `commit` recorded — the directory has to be tracked by the *resolved* repository's HEAD. Pre-existing lock records written before this field was added remain valid; `commit` is simply absent on them.

### Pending state

A pending task is **visible** in the registry, web UI, and API (as `"pending_approval": true`), but its triggers are **not armed**:

- Cron schedules are not registered.
- Webhook routes are not mounted.
- The task cannot be fired manually via the CLI, API, or chain.

Pending tasks appear with a badge in the web UI task list. The daemon also logs a remediation hint at startup for each held task.

### Content hash scope

The hash covers:

| Included | Not included |
|---|---|
| Every file in the task directory (`dir_hash`) | Task name / description fields |
| `permissions` block (after taskset overrides are resolved) | Tags, `mcp_exposed`, non-permission YAML fields |
| `runtime` field | Run history, KV data |
| `trigger.auth` (webhook auth flag) | `enabled` flag |

A taskset override that adds a network host to `permissions.net`, grants `permissions.run`, changes `runtime` from `deno` to `docker`, or removes `trigger.auth: true` will produce a new hash and re-pend the task.

## Configuration

```yaml
approval:
  enabled: true                    # enable the gate (default: false)
  sources:
    my-git-source:
      trust: always                # trust all tasks from this source without approval
  tasks:
    buildin/alert:
      trust: always                # trust this specific task
  notify_task: my-notifier         # task to fire when a task goes pending (optional)
```

### Fields

| Field | Default | Description |
|---|---|---|
| `approval.enabled` | `false` | Set to `true` to enable the gate. When `false`, all tasks arm immediately and are recorded in `dicode.lock` as inventory. |
| `approval.sources.<name>.trust` | — | Set to `always` to trust all tasks from the named source without manual approval. |
| `approval.tasks.<id>.trust` | — | Set to `always` to trust a specific task by ID without manual approval. Useful for individual tasks in an otherwise-gated source. |
| `approval.notify_task` | `""` | Task ID to fire whenever a task goes pending. See [Notification on hold](#notification-on-hold). |

### Trust policies

The gate resolves trust in the following priority order:

1. **Builtin tasks** (`buildin/*`) — always armed; recorded as `builtin`.
2. **Per-task trust** — `approval.tasks.<id>.trust: always`.
3. **Per-source trust** — `approval.sources.<name>.trust: always`.
4. **Gate disabled** — `approval.enabled: false`.
5. **Lock match** — the stored hash matches the current content hash.
6. **Pending** — all other cases.

## Pending tasks

### Discovering pending tasks

Three ways to find what is held:

1. **Web UI** — the task list shows a yellow **Pending** badge on any held task. Click it to open the approve dialog.
2. **REST API** — `GET /api/tasks/{id}` includes `"pending_approval": true` in the response body when the task is held.
3. **Daemon log** — on startup (or when a new task is pended), the daemon logs a message like:

```
task my-task/processor is pending approval (hash: a3f2…); approve via UI, CLI, or: POST /api/tasks/my-task/processor/approve
```

## Approving tasks

### 1. Web UI

The task list badges each pending task. Click the **Approve** button in the row (or in the task detail panel) to approve immediately. Authentication is required (session cookie).

Under the hood, the UI calls `POST /api/tasks/{id}/approve`.

### 2. CLI

```sh
dicode task approve <task-id>
```

The CLI communicates over the local control socket — no separate authentication is required beyond having daemon access. Examples:

```sh
dicode task approve my-source/my-task
dicode task approve buildin/alert
```

### 3. Tokenized link (for remote and notification workflows)

The daemon can generate a single-use tokenized approve URL — typically delivered via [approval.notify_task](#notification-on-hold) — that lets a remote operator approve a task without logging in:

```
https://your-dicode-host/approve/<token>
```

- `GET /approve/<token>` — renders a confirmation page. Safe for link prefetchers; does **not** consume the token.
- `POST /approve/<token>` — redeems the token and approves the task.

Token properties:

| Property | Value |
|---|---|
| Scope | Bound to the exact `(task_id, content_hash)` at pend time |
| TTL | 24 hours |
| Use | Single-use; consumed on first successful `POST` |
| Auth | Token is the credential — no login required |

If the task's content hash changes before the token is redeemed (e.g., another push lands), the token is invalidated and a new pending notification is sent.

## Notification on hold

Set `approval.notify_task` to the ID of a task that should fire whenever a task goes pending. The daemon calls it via `FireManual` — bypassing the gate, since the notify task itself must be trusted or builtin.

Parameters passed to the notify task:

| Param | Type | Description |
|---|---|---|
| `task_id` | string | ID of the task that just went pending |
| `hash` | string | Content hash at pend time |
| `approve_url` | string | Tokenized approve link (single-use, 24h TTL) |

Use these to deliver a message to Slack, email, ntfy, or any other channel:

```yaml
# dicode.yaml
approval:
  enabled: true
  notify_task: buildin/notify-approval  # or any task you write
```

```ts
// notify-approval/task.ts
export default async function main({ params }: DicodeSdk) {
  const taskId = await params.get("task_id");
  const approveUrl = await params.get("approve_url");

  await fetch("https://hooks.slack.com/services/…", {
    method: "POST",
    body: JSON.stringify({
      text: `Task *${taskId}* is pending approval.\n<${approveUrl}|Approve now>`,
    }),
  });
}
```

```yaml
# notify-approval/task.yaml
name: Notify Approval
runtime: deno
trigger:
  manual: true
permissions:
  net:
    - hooks.slack.com
```

::: warning Notify task must be trusted or builtin
If the notify task itself is not trusted (or builtin), it will sit pending and never fire. Either add it to `approval.tasks.<id>.trust: always`, use a `buildin/*` task, or trust its source.
:::

## First-run bootstrap

On first upgrade to a version with `approval.enabled: true`, **all non-builtin tasks go pending**. Choose one of three approaches:

### Option 1 — Trust the source

Add the source to `approval.sources`:

```yaml
approval:
  enabled: true
  sources:
    my-git-source:
      trust: always
```

All current and future tasks from that source arm without manual approval. Suitable for private repos where you own every commit.

### Option 2 — Populate the lock as inventory first

Run once with the gate disabled to populate `dicode.lock` with the current hashes:

```yaml
approval:
  enabled: false   # disabled: all tasks arm and are recorded
```

Then restart the daemon so it writes every task hash to `dicode.lock`. Re-enable the gate:

```yaml
approval:
  enabled: true
```

On the next restart, all tasks whose hashes are already in the lock re-arm immediately. Only future changes require approval.

### Option 3 — Approve tasks one by one

Use the web UI, CLI, or tokenized links to approve each task individually. This is the highest-trust option and the correct choice when you want a human to explicitly sign off on each task.

## API reference

### `GET /api/tasks/{id}`

Returns the task state. When the task is held by the approval gate, the response includes:

```json
{
  "id": "my-source/my-task",
  "pending_approval": true,
  ...
}
```

A task with `pending_approval: true` cannot be fired — manual fire, chain fire, and trigger dispatch are all blocked.

### `POST /api/tasks/{id}/approve`

Approves a pending task, writes the approval to `dicode.lock`, and arms the task's triggers immediately.

**Auth:** session cookie or Bearer API key.

| Status | Meaning |
|---|---|
| `200` | Task approved and armed |
| `404` | Task ID not found in the registry |
| `409` | Task is not in a pending state (already approved or trust-always) |

```sh
# Approve via curl with API key
curl -X POST http://localhost:8080/api/tasks/my-source/my-task/approve \
  -H "Authorization: Bearer <api-key>"
```
