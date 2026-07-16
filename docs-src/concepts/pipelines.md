# Pipelines (`kind: PipelineTask`)

A **pipeline** is a `kind: PipelineTask` that declares an ordered list of **stages**. Each stage is an existing `kind: Task`, run as its own child run. A stage must reach `status: success` for the pipeline to advance; the first failure short-circuits the rest. The previous stage's return value is piped forward via `${input.output}`, so the **render → persist → start-daemon** composition lives in one self-contained pipeline definition.

A pipeline lives in a task folder like any other task — the file is still **`task.yaml`**, discriminated by its `kind:`. There is no separate filename; the loader reads `kind: PipelineTask` and parses the pipeline schema instead of the `kind: Task` schema.

```yaml
apiVersion: dicode/v1
kind: PipelineTask
name: Render and Serve
description: Render config, persist it, then run the daemon body.
subtype: sequential

trigger:
  manual: true        # how the PIPELINE is fired (optional)

stages:
  - task: buildin/template       # stage 1: render
    overrides:
      params:
        - name: template_path
          default: "${TASK_DIR}/config.tmpl"
  - task: buildin/write-local    # stage 2: persist stage 1's output
    overrides:
      params:
        - name: content
          default: "${input.output}"
        - name: path
          default: "${DATADIR}/app/config.yml"
      fs:
        - path: "${DATADIR}/app"
          permission: rw
  - task: app-daemon-body        # terminal stage: a kind: Task daemon
```

## Pipeline fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `apiVersion` | string | yes | Must be `dicode/v1` |
| `kind` | string | yes | Must be `PipelineTask` |
| `name` | string | yes | Human-readable pipeline name |
| `description` | string | no | One-line (or multi-line) description |
| `subtype` | string | yes | `sequential` or `parallel`. See [Sequential semantics](#sequential-semantics) and [Parallel semantics](#parallel-semantics). |
| `trigger` | object | no | How the **pipeline** is fired. At most one trigger type. Omit for a pipeline that's only fired programmatically (e.g. via `dicode.run_task`). |
| `trigger.manual` | bool | no | Manual-only fire (API / UI) |
| `trigger.cron` | string | no | Standard 5-field cron expression |
| `trigger.webhook` | string | no | Webhook path, e.g. `/deploy` |
| `trigger.webhook_secret` | string | no | HMAC secret for the webhook (supports `${VAR}` expansion) |
| `trigger.auth` | bool \| `"session"` \| `"any"` | no | Gate the webhook (same semantics as `kind: Task`): `true`/`"session"` requires a dicode session, `"any"` accepts a session **or** a valid HMAC signature (requires `webhook_secret`), absent/`false` is public. See [Session authentication](./triggers.md#session-authentication) for the full breakdown. |
| `trigger.chain` | object | no | Chain trigger — fire the pipeline when an upstream task/pipeline completes |
| `stages` | list | yes | Ordered list of stages; at least one required |
| `stages[].task` | string | yes | Task ID of an existing `kind: Task` to run as this stage |
| `stages[].id` | string | no | Stable identifier for the stage, used as a `depends_on` target in parallel pipelines. Defaults to the stage's `task` value. |
| `stages[].depends_on` | list of strings | no | Stage IDs this stage waits for before starting (`subtype: parallel` only). Omit for stages with no dependencies — they start immediately. |
| `stages[].overrides` | object | no | Per-stage patch applied to the stage task's spec at dispatch time (see [Stage overrides](#stage-overrides)) |
| `timeout` | duration | no | Overall pipeline timeout (e.g. `5m`). Cancels the in-flight stage and fails the pipeline if exceeded. |

::: warning No `trigger.daemon` on a pipeline
A pipeline does **not** have a daemon trigger. It becomes daemon-shaped *implicitly* when its **terminal stage** is a `kind: Task` with `trigger.daemon: true` — see [Daemon terminal stage](#daemon-terminal-stage).
:::

A pipeline accepts `manual`, `cron`, `webhook` (with optional `webhook_secret` / `auth`), and `chain`. It does **not** accept `daemon`. As with `kind: Task`, at most one trigger type may be set.

## Sequential semantics

`subtype: sequential` runs the stages in declaration order:

1. Each non-terminal stage is fired as a child run and the pipeline **waits for it to reach `success`** before advancing.
2. The stage's return value is threaded into the next stage as `${input.output}` (see [Stage input threading](#stage-input-threading)).
3. The first stage to reach `failure` / `timeout` / `cancelled` **short-circuits** the pipeline: the remaining stages are never fired, the pipeline's run goes to `failure`, and `fail_reason` is set to `stage N (<task-id>): <error>` (N is **0-based**, so the first stage failing reports `stage 0 (...)`).

## Parallel semantics

`subtype: parallel` runs stages as a DAG, governed by `depends_on`:

1. Stages with **no `depends_on`** start immediately and run concurrently.
2. A stage with `depends_on: [A, B]` waits for **all** listed stages to reach `success` before starting (fan-in).
3. **Fail-fast**: the first stage failure cancels all in-flight sibling stages. The pipeline's run goes to `failure` with `fail_reason` identifying the failed stage.
4. The pipeline succeeds only when **every** stage reaches `success`.

```yaml
apiVersion: dicode/v1
kind: PipelineTask
name: Build and deploy
description: Lint and test in parallel, then deploy.
subtype: parallel

trigger:
  manual: true

stages:
  - id: lint
    task: ci/lint
  - id: test
    task: ci/test
  - id: deploy
    task: ci/deploy
    depends_on: [lint, test]   # waits for both to succeed
```

In this example `lint` and `test` start concurrently. `deploy` starts only after both succeed. If either fails, the other is cancelled and `deploy` never fires.

::: warning No input threading in parallel pipelines
`${input.output}` is available only in `subtype: sequential` pipelines. In parallel pipelines, stages communicate through shared state (KV, filesystem) or params — not through the `${input.…}` grammar.
:::

## Stage input threading

Stages thread data forward with the `${input.…}` interpolation grammar below, evaluated at dispatch time against the **previous stage's** output. (This is the dispatch-time token grammar; it is distinct from the runtime [`input` global](./triggers.md#input-passing) that a chained task reads.)

| Form | Resolves to |
| --- | --- |
| `${input.output}` | the previous stage's full string return value |
| `${input.output.<field>}` | a named string field of an object-shaped previous-stage return (e.g. `{path: "..."}`) |

These tokens are resolved **only** inside `stages[].overrides.params` defaults. Other override fields (`env[].value`, `fs[].path`, `timeout`, ...) are applied verbatim -- a `${input.…}` token in those is **not** interpolated and would be passed through literally. Empty strings are treated as "not provided": a token that would resolve to an empty string **fails the stage loudly** (`ErrInputUnavailable`) rather than substituting silently. Embedded forms (`"prefix-${input.output}-suffix"`) and multi-token forms work too. The `<field>` portion accepts letters, digits, underscores, hyphens, and dots — so `${input.output.db.host}` works without escapes.

::: warning v1 threads `Output` only
`${input.params.<name>}` (referencing the *upstream stage's* input params) is **not** supported in sequential pipelines and is rejected at load on every stage. Cross-stage param threading is a planned follow-up; for now, thread data forward through each stage's **return value** (`${input.output}`).
:::

::: warning The first stage receives no input
Any `${input.…}` reference in `stages[0].overrides` is rejected at load — there is no upstream stage to resolve it against. Use a literal default or an env-projected secret on stage 0.
:::

## Stage overrides

A stage may carry an `overrides:` block that patches a **deep copy** of the stage task's spec at dispatch time — the underlying `kind: Task` is untouched, so a manual / cron / chain fire of that same task is unaffected. Stage overrides accept a slightly **wider** allowlist than `trigger.chain.overrides`: crucially, a stage **may override the stage task's `trigger`**.

| Field | Allowed at a pipeline stage? |
| --- | --- |
| `params`, `env`, `net`, `fs`, `timeout`, `dicode`, `runtime` | yes |
| `trigger` | **yes** (unlike chain edges) — e.g. flip the terminal stage's `daemon`-ness |
| `enabled`, `name`, `description`, `retry`, `defaults`, `entries` | no (rejected at load) |

A stage runs **regardless of the stage task's own trigger type**: the engine dispatches the merged stage spec directly and never gates on whether the underlying `kind: Task` is `manual` / `cron` / etc. So a `manual: true` library task fires as a stage with **no** trigger override — for example the shipped `buildin/relay-server` pipeline fires `buildin/write-local` (which is `trigger.manual: true`) as a stage and overrides only `params` / `fs` / `timeout`, never `trigger`.

The `trigger` override is allowed at a stage so a stage can flip **daemon-ness** — set or clear `daemon: true` on the merged spec to make (or unmake) the terminal stage a daemon:

```yaml
stages:
  - task: my-server-task
    overrides:
      trigger:
        daemon: true    # make this the pipeline's terminal daemon stage
```

## Daemon terminal stage

If the **last** stage is a `kind: Task` with `trigger.daemon: true`, the pipeline is *daemon-shaped*: its lifetime is tied to the daemon's run.

- The render/persist stages run to `success` as usual, then the daemon stage is fired **without** a wait-to-success gate.
- The pipeline's run stays **`running`** for as long as the daemon's run is `running`.
- When the daemon run terminates, the pipeline's run terminates with the **daemon's actual status** — `success`, `failure`, or `cancelled`.
- **Killing or cancelling the pipeline** (`POST /api/runs/{id}/kill`, or the engine cancelling the parent run) propagates to the live daemon stage: the daemon run transitions to `cancelled`, which becomes the pipeline's terminal status.

Whether the terminal stage is a daemon is decided from the **merged** dispatch spec — a stage `trigger` override can flip daemon-ness either way.

### Re-rendering a live daemon

Re-firing any non-terminal stage of a *live* pipeline (e.g. an operator runs `buildin/template` directly to pick up rotated secrets) replays the descendant stages with fresh `${input.…}` and then restarts the terminal daemon so it adopts the freshly-rendered files. No pipeline restart or app restart is needed. Restarts are coalesced (at most one in flight per pipeline) so a flurry of rotations produces one re-render and one restart, not a thrash loop.

## Status semantics

| Situation | Pipeline run status |
| --- | --- |
| All stages succeed, terminal stage is **not** a daemon | `success` (return value = terminal stage's return) |
| All stages succeed, terminal stage **is** a daemon | `running` while the daemon runs, then the daemon's terminal status |
| Any stage reaches `failure` / `timeout` / `cancelled` | `failure`, with `fail_reason: stage N (<task-id>): <error>`; later stages never fire |
| Pipeline killed / cancelled while the daemon runs | `cancelled` |
| Overall `timeout:` exceeded | `failure` (the in-flight stage is cancelled) |

A pipeline's own return value is the **terminal stage's** return value, persisted to the parent run row the same way a `kind: Task`'s is — so chain consumers and `dicode.run_task` callers observe it. (The terminal stage's [`run_result.enabled: false`](./secrets.md) propagates, suppressing persistence of secret-bearing returns.)

## How pipeline runs appear

Each pipeline fire produces **N+1** run rows:

- One **parent** run with `kind=pipeline` (the pipeline's own run).
- One **child** run per stage, each `kind=task`, linked by `parent_run_id`, with `trigger_source=pipeline-stage`.

The dashboard lists runs per task. A pipeline fire shows up as the parent run on the pipeline's own task; drill into it to see its stage children grouped under the parent with their individual statuses. A daemon stage that fails shows up as a `failure` child under a `failure` pipeline parent.

## Pipeline vs. chain — when to use which

`kind: PipelineTask` does **not** replace `trigger.chain` (see [Triggers → Chain](./triggers.md#chain)). They model orthogonal orchestration concerns and coexist:

| Concern | Pipeline (`kind: PipelineTask`) | Chain (`trigger.chain`) |
| --- | --- | --- |
| Coupling direction | The pipeline declares the sequence; stages don't know they're in one | The downstream declares its dependency on an upstream; the upstream is unaware |
| Style | Procedural — one file describes the whole flow | Event-driven / observer |
| Discoverability | Read one spec → see the entire flow | Scan the task graph for `chain.from: A`; fan-out is implicit |
| Coordination | One team owns the pipeline file | One team can react to another's task without editing it |
| Cardinality | One pipeline, N ordered stages | One source, M downstream subscribers (natural fan-out) |
| Failure semantics | A stage failure short-circuits the pipeline | `on_failure_chain` lets a separate task react to failure |

**Reach for a pipeline** when you own the whole sequence and want it described in one place — especially the render → persist → start-daemon shape.

**Reach for a chain** when:

1. **Decoupled observability/auditing** — task A runs; audit-task B chains from it without modifying A or every consumer of A.
2. **Failure remediation** — `on_failure_chain` runs B only when A fails; pipelines have no "run only if failed" grammar yet.
3. **Cross-team coordination** — team Y fires B when team X's task A completes, without coordinating a shared pipeline file.
4. **Many-to-one aggregation** — task C reacts when any of {A, B, D} completes (C has a `chain.from` on each).

**They compose, too:**

- **Chain → pipeline:** a `kind: PipelineTask` with `trigger.chain.from: <task>` fires when the upstream completes; the first stage receives the upstream's return via the same `${input.…}` grammar.
- **Pipeline → chain:** another task's `trigger.chain.from: <pipeline-id>` fires when the pipeline's **overall** run terminates (not on individual stage completion).
- **Stage-level `on_failure_chain`** still fires: a stage is a `kind: Task`, so its own configured failure chain fires when that stage fails, independent of the pipeline's short-circuit.

## Worked example: `buildin/relay-server`

A `kind: PipelineTask` (`task.yaml`) whose terminal stage is a standalone daemon-body `kind: Task`:

```yaml
# tasks/buildin/relay-server/task.yaml  (kind: PipelineTask)
apiVersion: dicode/v1
kind: PipelineTask
name: Relay Server
description: Render relay.yaml from Doppler-fed env, then run the relay daemon.
subtype: sequential

stages:
  - task: buildin/template            # stage 1: render
    overrides:
      timeout: 30s
      params:
        - name: template_path
          default: "${TASK_DIR}/relay.yaml"
      fs:
        - path: "${TASK_DIR}/relay.yaml"
          permission: r
      env:
        - name: BASE_URL
          value: "https://relay.example.com"
        # ...Doppler-fed OAuth client_id/secret entries...

  - task: buildin/write-local         # stage 2: persist stage 1's output
    overrides:
      timeout: 30s
      params:
        - name: content
          default: "${input.output}"
        - name: path
          default: "${DATADIR}/relay/relay.yaml"
        - name: mode
          default: "0600"
      fs:
        - path: "${DATADIR}/relay"
          permission: rw

  - task: buildin/relay-server-body   # terminal stage: the daemon
```

```yaml
# tasks/buildin/relay-server-body/task.yaml  (standalone daemon body)
apiVersion: dicode/v1
kind: Task
name: Relay Server (daemon body)
description: Runs the relay daemon, reading the pre-rendered relay.yaml off disk.
runtime: deno

trigger:
  daemon: true
  restart: always

permissions:
  net: ["*"]
  fs:
    - path: "${DATADIR}/relay"
      permission: rw
  env:
    - DICODE_DATADIR
    - DICODE_VERSION
```

How this is shaped:

- The daemon body is a plain `kind: Task` that **reads** the pre-rendered config — it's independently runnable and carries no rendering concern. OAuth secrets and the status password are scoped to the render stage's `env`, never the daemon body's.
- The render and persist steps are `stages` in declaration order. `${input.output}` threads the rendered string from the template stage into the writer.
- Rotating Doppler secrets is simple: re-fire the render stage and the pipeline re-renders and restarts the terminal daemon.

::: tip Full Docker variant
For an end-to-end Docker variant — a hardened `cloudflared` tunnel whose terminal stage is a Docker daemon — see the [Cloudflare Tunnel worked example](https://github.com/dicode-ayo/dicode-core/blob/main/docs/examples/cloudflare-tunnel.md) in dicode-core.
:::

## Related

- [Triggers](./triggers.md) — cron / webhook / manual / chain / daemon
- [Tasks](./tasks.md) — the `kind: Task` reference
- [Secrets](./secrets.md) — `permissions.env`, secret providers, `run_result.enabled`
