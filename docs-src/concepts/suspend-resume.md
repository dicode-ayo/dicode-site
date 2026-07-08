# Suspend & Resume

A task can pause itself mid-run, hand a human a form to fill in, and pick up later exactly where it left off. This is **human-in-the-loop** automation: approval steps, "confirm before you proceed" wizards, multi-stage onboarding flows, or anything that needs a person's judgment before a task continues.

Under the hood, suspension is a distinct, non-terminal run status (`suspended`) rather than a failure or a blocking wait. The task's process exits, freeing the runtime immediately; the run resumes later as a brand-new continuation run.

## Why not just block?

A naive approach -- have the task `await` a promise that resolves when a human responds -- would hold a subprocess (and its runtime slot) open indefinitely, for hours or days, waiting on a person. `dicode.suspend()` avoids that: the task exits cleanly, the daemon persists everything needed to continue, and no process sits idle. Resuming spawns a fresh run rather than un-blocking the old one.

## The state / form / deadline contract

A task suspends by calling `dicode.suspend()` (Deno and Python both supported) with three pieces of information:

::: code-group

```ts [Deno]
await dicode.suspend({
  state: { step: "ask_name" },      // opaque -- echoed back on resume
  form: {
    title: "What's the project name?",
    fields: [
      { name: "project_name", type: "string", label: "Name", required: true },
    ],
  },
  deadline: Date.now() + 60 * 60 * 1000,   // optional; defaults to 24h
});
```

```python [Python]
dicode.suspend(
    state={"step": "ask_name"},
    form={
        "title": "What's the project name?",
        "fields": [
            {"name": "project_name", "type": "string", "label": "Name", "required": True},
        ],
    },
    deadline=None,   # optional; defaults to 24h
)
```

:::

- **`state`** -- an opaque, JSON-serializable value the task chooses. It's persisted server-side and handed back as `resume_state` / `ctx.resume_state` when the task re-enters. Use it to remember which step of a multi-step wizard the run was on.
- **`form`** -- a `FormSchema` (`title`, `description`, `fields[]`) describing what to collect from the human. The WebUI renders it; the CLI lists the field names as a hint for what to pass.
- **`deadline`** -- an optional Unix-ms timestamp. If omitted, the suspension is resumable for **24 hours** from the `suspend()` call. Past the deadline, the [automatic sweep](#automatic-deadline-sweep) cancels the run.

See the [`dicode.suspend()` SDK reference](./sdk.md#dicode-suspend) for the full field-by-field signature, and [`resume_state` / `resume_input`](./sdk.md#resume-state-resume-input) for how the task reads back state and the human's answer.

`dicode.suspend()` never returns: in Deno it's typed `Promise<never>`, and in Python it raises an internal control-flow signal that unwinds the task. Either way the subprocess exits with code 0 -- **this is a clean exit, not a failure.** The run's status becomes `suspended`, a status distinct from `success`, `failure`, and `cancelled`. Don't wrap the call in a `try`/`catch` (Deno) or `try`/`except` (Python) that swallows it and keeps executing; both SDKs detect a swallowed suspend signal and turn it into a loud run failure instead of silently continuing.

## The three resume paths

A suspended run can be resumed three ways.

### 1. WebUI form

The run-detail page for a `suspended` run renders the persisted `form` and lets the operator fill it in and submit. Submitting posts to:

```
POST /api/runs/{runID}/resume
```

with the collected values as a JSON body. The server validates required fields (a missing required field returns `400`), then spawns the continuation run and returns its ID. The raw resume token is never sent to the browser -- it's resolved server-side from the stored run record, so the session (or API key) is the authorization, not a client-supplied secret.

### 2. `dicode resume` CLI

```bash
# List every run currently awaiting resume, with the fields each expects
dicode resume

# Resume one, supplying the form values as field=value pairs
dicode resume <run-id> approve=yes note="looks good"
```

Bare `dicode resume` (no run ID) prints a table of suspended runs -- run ID, task, suspended-at time, and the field names from each run's persisted form -- so you know what to pass. `dicode resume <run-id> [field=value ...]` submits those values and prints the continuation run's ID.

### 3. Automatic deadline sweep

If nobody resumes a suspended run before its `deadline` (or the 24h default), a periodic sweep cancels it automatically. The swept run transitions `suspended` -> `cancelled`. Crucially, the timeout is **not silent**:

- The run's `run:finished` hook fires, so anything watching for completion (a live run-detail page, a webhook subscriber) learns the suspension expired instead of the page going stale forever.
- **`on: always` and `on: failure` chain edges fire**, exactly as they would for any other cancellation. A downstream cleanup or alert task chained on this task's failure/always outcome still runs when a suspension times out -- it is not silently dropped.

::: tip
If you want an operator to be notified when a human-in-the-loop step goes unanswered, chain an alert task with `on: always` (or `on: failure`) off the suspending task -- the deadline sweep will fire it.
:::

## Single-use resume tokens

Each suspension mints an unguessable, single-use resume token server-side; it's never exposed to callers (not in the WebUI JSON, not in the CLI listing). Resuming consumes the token atomically, so:

- Resubmitting the same suspended run a second time (double-click, retried request) fails with `409 Conflict` / "run is not suspended" -- the first resume already consumed the token.
- Resuming past the deadline fails with `410 Gone` / "resume deadline expired", and sweeps the run to `cancelled` as a side effect if the periodic sweep hasn't gotten to it yet.
- If the task was edited (and is pending re-admission) between suspend and resume, the resume attempt is rejected but the token is **not** consumed -- the run stays suspended and resumable once the task is admitted again.

## Params and chain depth carry over

The continuation run sees the same `params` the original run was fired with -- not the task's static `task.yaml` defaults -- and inherits the original run's chain-depth budget. A task suspended midway through a chain doesn't get a fresh chain-depth ceiling on resume, so the chain-depth guard against runaway loops still applies across a suspend/resume hop.

## Pipeline-stage suspend behavior

A `kind: PipelineTask` stage **cannot** suspend. If a stage task calls `dicode.suspend()`, the pipeline treats it as a stage failure: the pipeline run fails with an explanatory reason (`pipeline_stage_suspended`), and the orphaned suspended stage run is finalized (cancelled) immediately rather than left dangling as an unresumable `suspended` row. This keeps a stray suspend from wedging the parent pipeline indefinitely -- there is no pipeline-level resume path, only task-level.

If a pipeline's **terminal stage** is a daemon task (see [Pipelines -- Daemon terminal stage](./pipelines.md#daemon-terminal-stage)), that daemon body suspending is a normal, supported suspend -- the "cannot suspend" restriction applies only to non-terminal pipeline stages. A suspended daemon body keeps its daemon run slot reserved for the duration of the suspension, so a reconciler reload can't start a second body alongside the parked one; the slot is released correctly whichever way the suspension resolves (resumed or swept).

## Runtime scope

Suspend/resume is supported on the **Deno and Python** runtimes only. **Docker and Podman tasks cannot suspend** -- a container runtime runs an opaque image and has no way to intercept a mid-execution pause request and read the payload back, so granting the capability there would let a suspend attempt be acknowledged and then silently dropped. Calling `dicode.suspend()` (or the equivalent) from a Docker/Podman task fails with a permission-denied error instead.

Unlike the rest of `dicode.*`, this isn't something you opt into per task with a `permissions.dicode` flag -- the capability is granted automatically based on the task's `runtime:`, the same way other self-affecting primitives like `dicode.set_group()` are granted by default. See [Tasks -- Permissions](./tasks.md#permissions).

## Worked example

```ts
// task.ts
export default async function main({ dicode, resume_state, resume_input }: DicodeSdk) {
  if (!resume_state) {
    await dicode.suspend({
      state: { step: "ask_name" },
      form: {
        title: "What's the project name?",
        fields: [
          { name: "project_name", type: "string", label: "Name", required: true },
        ],
      },
    });
  }
  return { created: resume_input?.project_name };
}
```

```yaml
# task.yaml
apiVersion: dicode/v1
kind: Task
name: Suspend Wizard
description: A one-step suspend/resume wizard.
runtime: deno
trigger:
  manual: true
timeout: 10s
```

Firing this task suspends it immediately, asking for a project name. Resuming via any of the three paths above (WebUI form, `dicode resume <run-id> project_name=my-app`, or letting it time out) either completes the run with `{ "created": "my-app" }` or -- on a timeout sweep -- cancels it and fires any chained `on: always` / `on: failure` follow-up.
