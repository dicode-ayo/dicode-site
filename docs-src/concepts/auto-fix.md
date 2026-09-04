# Auto-fix Loop

When a task fails, dicode can fire an AI agent that diagnoses the failure, edits the failing task's source on a fix branch, validates the fix via tests + replay, then either pushes to the source's tracked branch (autonomous) or opens a pull request (review).

This page documents the loop end-to-end. The individual SDK primitives are in [SDK Globals](./sdk.md).

## How it works

```
┌────────────┐  fails   ┌────────────────────┐
│ user task  │─────────▶│ trigger engine     │
└────────────┘          │  on_failure_chain  │
                        └─────────┬──────────┘
                                  │ guards: cooldown, depth,
                                  │   per-task & global concurrency,
                                  │   per-source storm circuit breaker
                                  ▼
                        ┌────────────────────┐
                        │ buildin/auto-fix   │  reads input + redacted_fields
                        │  (ai-agent + skill)│  clones source on fix branch
                        └─────────┬──────────┘  iterates: edit → test → replay
                                  │
                          ┌───────┴────────┐
                  review  │                │  autonomous
                          ▼                ▼
                  ┌─────────────┐    ┌─────────────┐
                  │ buildin/    │    │ git_commit_ │
                  │   git-pr    │    │   push      │
                  │ (gh CLI)    │    │ (tracked    │
                  └─────────────┘    │   branch)   │
                                     └─────────────┘
```

## Quick start

Add `on_failure_chain: buildin/auto-fix` to any task that fails sometimes:

```yaml
# tasks/my-task/task.yaml
runtime: deno
trigger: { webhook: /hooks/process-payment }
on_failure_chain:
  task: buildin/auto-fix
  params:
    mode: review            # default — opens a PR for human approval
    # mode: autonomous      # alternative — pushes directly to tracked branch
```

For autonomous mode you also need a fine-grained PAT in the secrets store under the key `GH_TOKEN_AUTOFIX`, scoped to **Contents: Read & write** + **Pull requests: Read & write** on the target repo.

## What the agent does

1. **Reads context.** Failed run's `taskID`, `runID`, `status`, `output`, plus the persisted input and `redacted_fields` (via `dicode.runs.get_input`).
2. **Pins the input** so the daemon's retention sweeper doesn't delete it mid-loop.
3. **Opens a fix branch** — clones the source under `${data}/dev-clones/<source>/<runID>/` checked out on `${branch_prefix}<runID>` (review) or the tracked branch (autonomous), via `dicode.sources.set_dev_mode`.
4. **Iterates** (cap: `max_iterations`, default 5; per-iteration timeout `max_iteration_seconds`, default 300s):
   - Read failing task's source files
   - Edit (only inside the failing task's directory)
   - Validate: re-typecheck, run `dicode.tasks.test(<failingTaskID>)`
   - Replay: `dicode.runs.replay(<failedRunID>)` — succeeds because the agent's run was fired with `parent_run_id = <failedRunID>` (lineage check passes)
   - If both green → exit loop
5. **Commit + push** via `dicode.git.commit_push`.
6. **Open the PR** (review only) via `dicode.run_task("git-pr", { ... })`.
7. **Disable dev mode** — engine removes the local clone; the remote branch is retained.
8. **Unpin input** (deferred cleanup also handles timeout / panic).

The skill prompt [`dicode-auto-fix.md`](https://github.com/dicode-ayo/dicode-buildin/blob/main/skills/dicode-auto-fix.md) — shipped from the separate [dicode-ayo/dicode-buildin](https://github.com/dicode-ayo/dicode-buildin) repo — prescribes the exact sequence and the "do not write outside the failing task's directory" rule.

## Engine guardrails

The trigger engine enforces hard caps before every `on_failure_chain` fire — these protect against runaway loops, API budget burn, and concurrent-fix collisions.

| Guard | Default | Override site |
|---|---|---|
| Cooldown per failing task | `10m` | `on_failure_chain.cooldown` |
| Per-task concurrency cap | `1` | `on_failure_chain.max_concurrent` |
| Global concurrency cap | `3` | `defaults.on_failure_chain.max_concurrent_global` (defaults-only) |
| Chain depth | `2` hops | `on_failure_chain.max_depth` |
| Storm circuit breaker | `> 10` fires within `1m` → suppress that source for `30m` | `defaults.on_failure_chain.storm.{rate, window, suppress}` (defaults-only) |
| Replay → on_failure_chain | always suppressed | not configurable |
| Branch prefix | `fix/` | `on_failure_chain.params.branch_prefix` |
| `--force` push | always refused | not configurable |

::: tip Concurrent sessions across the same source
Since dicode-core #444, multiple dev-mode clone sessions on the **same source** run concurrently as long as each uses a distinct `run_id` — whether they target the same task or different ones. Previously, a second `SetDevMode` call on the same source was rejected regardless of `run_id`, making source-level serialization the effective limit (below the engine's global cap). If you set the global cap lower than 3 as a workaround, you may now raise it.
:::

`max_concurrent_global` and `storm` are **operator policy** — only honored at the defaults level. Per-task blocks that set them get a config-load WARN and the fields are zeroed.

State (cooldown timestamps, in-flight counters, storm windows) lives in memory on the daemon. A daemon restart resets it — by design for v1; persistence is a future enhancement.

## Modes

### Review mode (default)

The agent commits + pushes the fix branch, then calls `buildin/git-pr` which shells out to `gh pr create`. A human reviews and merges. The remote branch stays even after the auto-fix run ends so reviewers see the diff.

### Autonomous mode

`mode: autonomous` skips the PR step and pushes directly to the source's tracked branch. The engine still validates the branch via `pkg/source/git.CommitPush` (no `--force`, branch must satisfy `branch_prefix` OR be the tracked branch with `allow_main: true`). Use only when the source repo has branch protection on the tracked branch (so a misfire still requires review).

`mode` is **never inferred** by the engine for non-auto-fix chain targets — it's stamped automatically only when `on_failure_chain.task == buildin/auto-fix`.

## Replay-fidelity caveat

Persisted inputs are redacted at write time — fields named like `Authorization`, `password`, `secret`, signatures, etc. are stripped (see [run-input persistence in #233](https://github.com/dicode-ayo/dicode-core/pull/243)). The replayed run sees the redacted form, so:

- A failing task that HMAC-validates the request body will not pass replay (the signature is gone).
- A task that depends on `Authorization: Bearer <token>` will see an empty header.

The `redacted_fields` array is surfaced in the agent's input so it can mention the gap in the PR body. Operators with sensitive auth flows should set `auto_fix.include_input: false` and let the agent reason from logs + output only.

## Building your own auto-fix variant

The `runs_get_input` permission was historically reserved for the buildin auto-fix preset, but is now YAML-grantable. Any task with `permissions.dicode.runs_get_input: true` can call `dicode.runs.get_input(runID)` — subject to a lineage check: caller's task must own the run, OR the caller's `parent_run_id` must match the requested run id.

This means you can build:

- A **custom replayer** with retry/backoff logic
- An **audit task** that captures failure context to S3
- A **fixer for a specific stack** that prefers smaller models or different prompts

Just declare the permissions you need and wire them up. The buildin/auto-fix preset is a sensible default, not a magic blessing.

```yaml
# tasks/my-custom-fixer/task.yaml
runtime: deno
trigger: { manual: true }
permissions:
  dicode:
    runs_get_input: true
    runs_replay: true
    sources_set_dev_mode: true
    git_commit_push: true
    tasks_test: true
```

## Related

- [SDK Globals](./sdk.md) — the individual `dicode.runs.replay`, `dicode.tasks.test`, `dicode.sources.set_dev_mode`, `dicode.git.commit_push` methods
- [Tasks](./tasks.md#field-reference) — `on_failure_chain` field reference
- [Triggers](./triggers.md) — chain triggers in general
- [Spec: on-failure auto-fix loop design](https://github.com/dicode-ayo/dicode-core/blob/main/docs/superpowers/specs/2026-04-28-on-failure-auto-fix-loop-design.md) — full design rationale
