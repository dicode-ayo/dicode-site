# AI Agent

Dicode ships a built-in **ai-agent** task that provides a full chat interface where an AI model can call your other dicode tasks as tools. Open it like any other webhook task — navigate to `/hooks/ai` in the dashboard — and you're talking to a model that can actually *do* things in your dicode install, not just generate text.

This is a complement to dicode's [AI task generation](./sdk) feature. AI generation helps you *author* tasks; the agent helps you *operate* them.

## AI at every stage

Most automation tools stop at "AI helps you write code." dicode puts AI at every stage of the task lifecycle:

| Stage | What AI does | How it works |
|-------|-------------|--------------|
| **Create** | Generates task.yaml + task.ts from plain English | `dicode task create` opens an authoring session; AI writes and validates files in the session, then saves to git. See [AI Task Authoring](#ai-task-authoring). |
| **Validate** | Checks cron syntax, permissions, error handling | AI reviews generated code before it goes live — catches missing env vars, wrong trigger config, common anti-patterns |
| **Deploy** | Commits to git, reconciler auto-deploys | No human deploy step — git commit triggers the reconciler, task is live in seconds |
| **Monitor** | Watches runs, detects failure patterns | AI agent can query run history, detect repeated failures, response time changes, error rate spikes |
| **Fix** | Diagnoses errors, generates patch, commits fix | Task fails → AI reads error + logs + source → generates a fix → commits to git → reconciler redeploys |

Every AI action is a **git commit** you can review, revert, or override. The AI agents that perform these stages are **themselves tasks** — replaceable, customizable, versioned in git like everything else.

### BYO any LLM

All AI features work with any OpenAI-compatible API:

- **OpenAI** (GPT-4o, o1)
- **Anthropic** (Claude, via OpenAI-compat proxy)
- **Ollama, LM Studio** (free, runs locally, no API key)
- **Groq, Together, OpenRouter, DeepSeek**

Set `base_url` and `api_key_env` in your config. Use a free local model for development, a cloud model for production. Switch in one line.

### Or use your Claude.ai subscription

If you already pay for Claude Pro/Max, the [`buildin/ai-agent-claude-cli`](#subscription-backed-alternative-buildin-ai-agent-claude-cli) task wraps the official `claude` CLI so dicode runs against your subscription quota instead of charging per-token via the API. Install the `claude` binary on the daemon host and any task that calls `dicode.run_task("ai-agent-claude-cli", ...)` runs on your subscription — mint a `CLAUDE_CODE_OAUTH_TOKEN` if you want, or let it fall back to a local `claude` login. See [Setup](#setup-three-steps) below.

### What happens when AI is wrong?

The fix is a git commit. If the fix breaks things, the next run fails, and the monitoring loop catches it — same as a human mistake. `git revert` is always one command away. You can configure:

- **Review before deploy** — AI generates a PR instead of committing directly
- **Auto-revert on failure** — if the patched task fails, revert to the previous version
- **Full autonomous mode** — AI commits and deploys without human intervention

The dial between human control and AI autonomy is yours to set.

## What you get

- **A chat page** at `/hooks/ai`, with per-provider presets at `/hooks/ai/ollama`, `/hooks/ai/openai`, and `/hooks/ai/groq`. The task-detail page in the dashboard also embeds a dedicated agent at `/hooks/ai/dicodai` (the `buildin/dicodai` preset) preloaded with the `dicode-task-dev` skill — that's the one powering the "AI" chat button when you're editing a task.
- **Tool use** — the agent discovers every registered task and exposes them as OpenAI-compatible tools. Each task's declared params become the tool's schema. Ask "how many deploys failed yesterday?" and the agent calls the right task, reads the result, and answers with real data.
- **Skills** — markdown files under `tasks/skills/` that the agent can look up on demand (or, in `eager` mode, gets loaded into its system prompt up front). Think of them as domain knowledge the agent should have available: runbooks, glossaries, team conventions. See [Tools vs skills](#tools-vs-skills).
- **Persistent sessions** — conversations are keyed by `session_id` and stored in KV. Pass your own id to resume, or omit it to have the task generate and return one.
- **Lazy history compaction** — when a conversation exceeds `max_history_tokens`, older turns are replaced by a running summary generated via a second model call. The buildin stays snappy on long conversations without silently losing context.
- **Configurable temperature** — a `temperature` param (0–2, default 0) controls sampling for both normal turns and compaction summaries; the low default keeps tool calls structured rather than emitted as prose. This param is specific to `buildin/ai-agent` — `buildin/ai-agent-claude-cli` shells out to the Claude CLI rather than calling a chat-completions API directly, so it has no `temperature` param.
- **Provider-agnostic** — works with OpenAI, Anthropic (via openai-compat), Ollama, LM Studio, Groq, OpenRouter, Together, DeepSeek — anything that speaks the OpenAI chat completions API.

## Quickstart

The buildin `ai-agent` task ships maximally restrictive — no default provider, no network access, no API keys. To make it useful, pick a preset from the examples taskset, or copy one and change the provider.

### With a local Ollama

Install Ollama on your machine, pull a model, then hit the Ollama preset:

```sh
ollama pull llama3.2
```

Open `http://localhost:8080/hooks/ai/ollama` in your browser and start chatting. No API key needed — the preset allows local network access only, and the task uses a placeholder for the OpenAI SDK's `apiKey` field.

### With Groq (free tier)

Grab a free API key at [console.groq.com](https://console.groq.com), then export it before launching the dicode daemon:

```sh
export GROQ_API_KEY="gsk_..."
dicode
```

Open `http://localhost:8080/hooks/ai/groq`. The preset points at `llama-3.3-70b-versatile`, which supports tool calls reliably.

### With any other OpenAI-compatible provider

Copy one of the preset entries in `tasks/examples/taskset.yaml` and edit the three provider params:

```yaml
ai-agent-together:
  ref:
    path: ../buildin/ai-agent/task.yaml
  overrides:
    trigger:
      webhook: /hooks/ai/together
    params:
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo"
      base_url: "https://api.together.xyz/v1"
      api_key_env: "TOGETHER_API_KEY"
    env:
      - TOGETHER_API_KEY
    net:
      - api.together.xyz
```

No code duplication — all presets share the same `task.ts`.

## Tools vs skills

Dicode uses these two words with specific meanings, matching the convention in Claude Code and the broader agent ecosystem:

| Concept | What it is | Where it lives | How the agent sees it |
| ------- | ---------- | -------------- | --------------------- |
| **Tool** | A dicode task the agent can execute | `tasks/**/task.yaml` | An OpenAI tool schema built from the task's params; invoked via `dicode.run_task()` |
| **Skill** | A markdown file with domain context | `tasks/skills/*.md` | Advertised by name and description in the system prompt; the body is fetched on demand via `dicode_read_skill` (or, under `skills_mode: eager`, concatenated into the system prompt at the start of every turn) |

Tools are **capabilities**. Skills are **knowledge**.

### Controlling tools per request

By default the agent can call any registered task except itself. Restrict the tool list with a comma-separated `tools` param:

```sh
curl -X POST http://localhost:8080/hooks/ai/groq \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "what failed last night?",
    "tools": "examples/weekly-report,examples/log-digest"
  }'
```

### Loading skills per request

Pass skill file names (without `.md`) in a comma-separated `skills` param:

```sh
curl -X POST http://localhost:8080/hooks/ai/groq \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "walk me through the overnight deploy",
    "skills": "dicode-basics,deploy-runbook"
  }'
```

Every name you pass is read at the start of the run. What reaches the model from there is decided by the `skills_mode` param — see [Skill loading modes: index vs. eager](#skill-loading-modes-index-vs-eager) below. Missing or unreadable skills still appear (as a placeholder line or entry) instead of failing the request.

A starter skill ships at `tasks/skills/dicode-basics.md` covering core dicode concepts an agent should know to be useful.

### Skill loading modes: index vs. eager

As of [dicode-core#759](https://github.com/dicode-ayo/dicode-core/pull/759), loaded skills no longer land in the system prompt in full by default. A `skills_mode` param controls the tradeoff:

| `skills_mode` | What the system prompt carries | Lookup tool |
| ------------- | ------------------------------ | ----------- |
| `index` (default) | One line per skill: its name and its frontmatter `description` | `dicode_read_skill` returns a skill's full body |
| `eager` | Every skill's full body, on every turn | not offered |

`index` is the default because a skill's full text is often many times the size of the agent's own `system_prompt`, and a model reading both tends to imitate the skill's examples rather than follow its own instructions — dicode-core#759 measured eager-loading 22 KB of skill taking a correct task manifest from 8/8 to 0/8 on an 8B model, with the tool-call protocol itself unaffected. The eager cost is also paid on every iteration of the tool loop, since the system prompt is rebuilt each time. Reach for `skills_mode: eager` only when the model can't be relied on to call a tool before it acts.

Under `index` mode, the agent gets a `dicode_read_skill` tool alongside the catalogue (only offered when at least one skill is configured):

- **Input:** `{ "name": "<skill name, exactly as listed in the index>" }`
- **Returns:** `{ "name", "description", "body" }` for a skill that loaded; `{ "error": "unknown skill: <name>", "available": [...] }` for a name not in the configured `skills` list; or `{ "error": "skill <name> not loaded: <reason>" }` for a name that *is* in the `skills` list but couldn't be turned into a skill — a bad filename, an empty `skills_dir`, or an actual disk-read failure.

Because only the name and description reach the model up front, a `system_prompt` under `index` mode has to name the skill it wants read and when — the description alone doesn't trigger a fetch. The built-in `auto-fix`, `task-create`, and `dicodai` presets (`tasks/buildin/taskset.yaml`) all carry this kind of pointer text, e.g. auto-fix's system prompt says "Read the dicode-auto-fix skill before anything else... Read dicode-task-dev before you write to any file."

The skills block is also positioned differently by mode: under `index`, the catalogue is placed **before** the operator's own `system_prompt`, so the operator's instructions are the last thing the model reads before the request — dicode-core#759 found that placing the same index *after* the system prompt caused the model to narrate its plan instead of executing it (6/6 → 0/6 structured tool calls on an 8B model). Under `eager`, skill bodies stay **after** the `system_prompt`, matching where they've always been, so opting back into `eager` reproduces the old prompt shape byte-for-byte.

`dicode_read_skill` is purely an internal mechanism of the `ai-agent` task's own OpenAI-style tool loop — it is not gated by `permissions.dicode`, not listed as a dicode SDK global, and not reachable through the `/mcp` endpoint. It only exists inside a chat turn the model itself is driving.

## Picking the task the WebUI and CLI use

The WebUI's in-task AI chat panel and the `dicode ai` CLI both forward to a single configurable task, named by `ai.task` in `dicode.yaml`:

```yaml
ai:
  task: buildin/dicodai   # default — change to any ai-agent preset
```

When omitted the default is `buildin/dicodai`, a preset of `buildin/ai-agent` preloaded with the `dicode-task-dev` skill. Point `ai.task` at any preset (e.g. `examples/ai-agent-ollama`) to swap providers, skills, or model without changing code.

The target task **must have a webhook trigger under `/hooks/`** — anything else is rejected at forward time with `500 ai task webhook must be under /hooks/`. This keeps `/api/ai/chat` from being used as an authenticated proxy to arbitrary infrastructure routes and closes a self-dispatch loop.

Two surfaces read this setting:

- **`POST /api/ai/chat`** — used by the WebUI chat panel when you're editing a task. Forwards the JSON body to the configured task's webhook and returns its response. The outer request is gated by `requireAuth` when `server.auth: true`; additionally, the forward re-enters the router and passes through `webhookAuthGuard`, so a configured task with `trigger.auth: true` enforces a valid session on every call regardless of `server.auth`. The default `buildin/dicodai` has `auth: true`, so this endpoint always requires a dicode session in practice.
- **`dicode ai "<prompt>" [--session-id ID] [--task TASK_ID]`** — fires the configured task through the engine over the CLI control socket. `--task` overrides `ai.task` for this call only; `--session-id` (alias `-s`) continues an existing conversation. Both flags also accept `=VALUE` single-token forms, and a `--` sentinel terminates flag parsing so prompts that start with `--task` or `--session-id` can be passed verbatim. The first turn's generated session id is printed to stderr as `session: <id>` so it doesn't pollute reply-consuming pipes.

```sh
# First turn — session id goes to stderr, reply to stdout.
dicode ai "what tasks failed last night?"

# Continue the conversation — -s is short for --session-id.
dicode ai -s 7f3a... "dig into the github-stars one"

# Override ai.task for this call only.
dicode ai --task examples/ai-agent-ollama "quick question for the local model"

# Prompt that literally starts with a flag name — use -- to terminate parsing.
dicode ai -- --task is not a flag here
```

## Session model

The task uses a hybrid session-id scheme:

- **First turn:** caller omits `session_id`. Task generates a UUID and returns it in the response payload.
- **Subsequent turns:** caller passes the same `session_id` back. Task loads the conversation from KV, appends the new turn, runs the completion, saves.

```json
// First request
POST /hooks/ai/groq
{ "prompt": "hi" }

// First response
{
  "session_id": "e4b9f3a2-8b71-4c3d-9f06-1a2b3c4d5e6f",
  "reply": "Hi! How can I help?"
}

// Second request
POST /hooks/ai/groq
{
  "prompt": "what tasks do I have?",
  "session_id": "e4b9f3a2-8b71-4c3d-9f06-1a2b3c4d5e6f"
}
```

The bundled chat page persists `session_id` in `localStorage` so refreshing the page preserves the conversation (though the UI DOM resets — full history rehydration across reloads is a follow-up).

## Security notes

- **The agent has `permissions.dicode.tasks: ["*"]` by default.** Anything registered with the runtime is callable. On an untrusted network this is a keys-to-the-kingdom endpoint. Restrict via the `tools` param or (when auth-protected webhooks land) the `auth: true` trigger flag.
- **API keys never enter the conversation.** They are resolved from `Deno.env.get(api_key_env)` at task start and used only to construct the OpenAI client. They are not logged, not returned, and not visible to the model.
- **Model output is rendered as `textContent`**, never `innerHTML`. The chat UI is safe by default against untrusted markdown/HTML in responses.
- **Session blobs are per-task and isolated.** They live under the `buildin/ai-agent` task's own KV namespace.

## AI Task Authoring

Beyond the chat agent that *operates* your tasks, dicode ships an interactive **task authoring** workflow that lets the AI — or you — create and edit tasks in a controlled draft environment before anything touches git.

### What authoring sessions are

An **authoring session** is a server-side draft that holds proposed changes to one task's files (`task.yaml`, `task.js` / `task.py`, `task.test.js`) before they are committed to the source git repo. Sessions decouple the "write files" step from the "commit to git" step, giving you (or the AI) the opportunity to review a live diff in the WebUI and iterate before anything is permanent.

Session lifecycle:

| Step | What happens |
|---|---|
| **Open** | `dicode task create <name> [--source NAME] [--ai "PROMPT"]` scaffolds a new task — refused up front against a git-backed, non-dev-mode source (see [`SandboxPath`](#the-write-boundary-sandboxpath) below) — and `--ai` additionally opens an authoring session, chaining straight into an AI turn. A plain `task create` with no `--ai` opens no session at all. `dicode task edit <task-id> ["PROMPT"]` always opens (or resumes) a session on an existing task, prompt or not. Whenever a session does open, its ID is printed to stderr, the task ID to stdout, and the session's **`SandboxPath`** is resolved; files start as copies of the current task (edit) or an empty scaffold (`--ai` create). |
| **Edit** | The AI or user writes files into the session via IPC or REST. Each write is immediately reflected in the WebUI's diff view. |
| **Validate** | Optional — `task.yaml` is parsed and linted against the task schema. Validation errors are returned without closing the session. |
| **Save** | `dicode task save <session-id>` commits the draft files to the configured git source. The reconciler picks up the change within ~1 s. |
| **Cancel** | `dicode task cancel <session-id>` discards the draft. No git change is made. |

Session files are stored in the daemon's data directory (not in git) until save is called. Sessions are automatically expired after 24 hours if neither save nor cancel is called.

### The write boundary: `SandboxPath`

A session's write tool isn't free to touch the whole source — it's confined to a single directory, `AuthoringSession.SandboxPath`, resolved once when the session opens. Whether an AI turn can actually write into that directory is checked against `buildin/write-task-file`'s own `fs` permission grant and its `DICODE_TASK_FILE_ROOTS` — not the target task's — so it's an override on the `buildin/write-task-file` taskset entry, not the task being authored, that widens or narrows what any session's write tool can reach.

**`dicode task create` (CLI or `POST /api/task/create`) naming a git-backed taskset source is refused outright**, before anything is scaffolded, unless the source has [dev mode](/concepts/sources#dev-mode) enabled — a per-source toggle, not a daemon-wide setting. Outside dev mode, a git source's files resolve under the reconciler's pull cache, which gets overwritten with `Force: true` on every sync, so anything scaffolded there could work only until an unrelated upstream `git pull` silently discarded it. In dev mode the source resolves into a real clone instead, giving it a stable working tree.

The same check runs again, against the resolved `SandboxPath`, right before `dicode task edit <task-id> "<prompt>"` fires an AI turn on the CLI — so a git-backed, non-dev-mode source is refused there too, and the error names the directory, the grant it was measured against, and which taskset entry to override. It only fires when a turn is about to run, though: a **bare** `dicode task edit <task-id>` (no prompt) just opens the session with no check at all, and `POST /api/task/edit` accepts a `prompt` field but never acts on it — no turn fires over REST, so REST edit is never subject to this refusal either. In short, the refusal is unconditional for `task create` (CLI and REST) and applies to `task edit` only when a prompt fires a turn — which today is CLI-only. (dicode-core [#769](https://github.com/dicode-ayo/dicode-core/pull/769).)

### CLI verbs

Four `dicode task` subcommands manage sessions:

```sh
# Create a new task and open an authoring session.
# Prints task_id to stdout; session_id and WebUI URL go to stderr.
dicode task create <name> [--source NAME] [--ai "PROMPT"]

# Open an edit session on an existing task, optionally with an initial AI prompt.
# Prints session_id to stderr; resume the same session with --session.
dicode task edit <task-id> ["<prompt>"] [--session <session-id>]

# Commit the draft files to git and close the session.
# Prints task_id (or PR URL for git sources) to stdout.
dicode task save <session-id>

# Discard the draft and close the session.
dicode task cancel <session-id>
```

Combine with the AI agent for an interactive authoring loop:

```sh
# Create the task scaffold; capture session_id from stderr.
dicode task create my-stripe-monitor --ai "check Stripe status every 15 min" 2>/tmp/session-meta.txt
SESSION=$(grep '^session:' /tmp/session-meta.txt | awk '{print $2}')

# Review the diff in the WebUI (URL printed to stderr), then save.
dicode task save "$SESSION"
```

### AI-driven creation is a two-stage pipeline

Every AI turn fired from the CLI — `dicode task create --ai "PROMPT"` (which scaffolds, then chains straight into an edit session with that prompt) and `dicode task edit <task-id> "<prompt>"` alike — runs through the task named by `ai.create_task` in `dicode.yaml` (`buildin/task-create` by default), which is a `kind: PipelineTask` with two stages:

1. **`buildin/task-create-turn`** — the agent turn: writes files into the session, as before.
2. **`buildin/verify-task-written`** — reads the session's directory afterward and fails the pipeline if the turn didn't leave behind a runnable task (no manifest, no `kind: Task`, or just the untouched scaffold).

Previously, a turn that never actually wrote a valid task — wrong tool name, an unwritable path, an unreliable model, a swamped prompt — still settled as a **successful run**, because nothing checked the agent's claims against disk. Now that path fails the pipeline: the CLI call exits non-zero and the run is recorded as a failure instead of a false-positive success with an empty or stale task directory. The pipeline only runs when a prompt actually fires a turn — a plain `dicode task create`/`task edit` (no prompt) never reaches it, and neither does `POST /api/task/create` or `/api/task/edit`, since neither REST endpoint fires a turn at all. (dicode-core [#760](https://github.com/dicode-ayo/dicode-core/pull/760).)

### REST API

For custom integrations or AI agent tool-call paths, the same lifecycle is available over HTTP. All routes are under `/api/` and require authentication (session cookie or `Authorization: Bearer <api-key>`). Session IDs are passed in the JSON request body.

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/task/create` | `{"name": "<name>", "source": "<source>"}` | Scaffold a new task's boilerplate directly — no authoring session opens. Returns `{"task_id": "...", "source": "...", "files": [...]}`. Call `/api/task/edit` with the returned `task_id` to open a session against it (needed before `/api/task/save` or `/api/task/cancel` — both require a `session_id`, which only `/api/task/edit` returns). |
| `POST` | `/api/task/edit` | `{"task_id": "<id>"}` or `{"session_id": "<sid>", "task_id": "<id>"}` | Open (or resume) an edit session for an existing task. Returns `{"session_id": "...", "sandbox_path": "...", "source": "...", "source_kind": "..."}`. |
| `POST` | `/api/task/save` | `{"session_id": "<sid>"}` | Commit the session's files to the git source and close the session. Returns `{"applied": true}`. |
| `POST` | `/api/task/cancel` | `{"session_id": "<sid>"}` | Discard the session. Returns `{"cancelled": true}`. |

`/api/task/create` never opens a session, so it has no `SandboxPath` of its own — but it still refuses a git-backed, non-dev-mode source outright, on the same underlying durability check that backs the [`SandboxPath` git-source refusal](#the-write-boundary-sandboxpath) (both exist because a git source's files aren't safe to write to outside dev mode). `/api/task/edit` accepts a `prompt` field but never acts on it, so no AI turn ever fires over REST — which means neither that refusal nor the [pipeline verification stage](#ai-driven-creation-is-a-two-stage-pipeline) applies to it; both are checks against a turn that, over REST, is never taken.

### WebUI flow

The WebUI's **New Task** button and the per-task **Edit** button both use authoring sessions internally. While a session is open, the task-detail page shows a **diff view** (current git state → session state) so you can review every proposed change before saving. Clicking **Save** calls `POST /api/task/save`; **Discard** calls `POST /api/task/cancel`.

### How the AI agent uses sessions

The built-in AI agent tasks (`buildin/ai-agent`, `buildin/ai-agent-claude-cli`) use authoring sessions when generating or editing tasks. The flow:

1. Agent receives a prompt like *"add a task that monitors GitHub stars daily"*.
2. Agent calls `dicode.run_task("buildin/create-session")` or the IPC equivalent to open a session.
3. Agent writes generated files into the session via IPC tool calls.
4. Agent optionally runs validation and iterates on errors.
5. Agent calls save — or surfaces the `session_id` to the human for manual review and save.

This is how the **AI at every stage** table's "Create" row works end-to-end under v0.4.0+.

## Subscription-backed alternative: `buildin/ai-agent-claude-cli`

`buildin/ai-agent` talks to OpenAI-compatible HTTPS endpoints with per-task API keys — the standard provider-agnostic path. If you have a **Claude.ai Pro or Max subscription**, there's a parallel buildin task that wraps the official `claude` CLI so dicode drives Claude with your subscription credentials instead of paying per token.

### When to pick which

| | `buildin/ai-agent` | `buildin/ai-agent-claude-cli` |
|---|---|---|
| Backend | OpenAI-compatible HTTPS endpoint | Local `claude` CLI subprocess |
| Auth | Per-task `*_API_KEY` env or secret | `CLAUDE_CODE_OAUTH_TOKEN` — optional; falls back to the daemon host's logged-in `~/.claude/.credentials.json` |
| Billing | Per-token via the chosen provider's API | Counts against subscription rate windows (Pro/Max: 5-hour) |
| Model selection | `model` param | `model` param (`sonnet`, `opus`, …) |
| Tool use | dicode tasks via `tools` param | Partially governed: Claude's dangerous built-in tools (Bash, Read, Write, Edit, NotebookEdit, WebFetch, WebSearch, Glob, Grep, Task, KillShell) are always denied via `--disallowedTools`, fail-closed regardless of MCP wiring; `mcp__dicode` is additionally granted via `--allowedTools` only when MCP is wired (`enable_mcp: true` + a `DICODE_MCP_API_KEY`) |
| Setup | Provide an API key | Install `claude` binary on the daemon host; OAuth token is optional |

If your dicode workload fits inside a 5-hour Pro/Max window — typical for auto-fix loops or occasional ad-hoc agent calls — the CLI path is free of marginal cost. For non-Anthropic models, predictable per-token billing, or workloads that exceed the subscription rate cap, stay on `buildin/ai-agent`.

Both can coexist: nothing prevents one task from using the API path and another from using the subscription path.

### Setup (three steps)

1. **Auth: optional OAuth token, with a local-login fallback.** `task.yaml` declares `CLAUDE_CODE_OAUTH_TOKEN` under `permissions.env` with `optional: true` — the task's pre-flight no longer hard-fails when it's unset. Pick whichever fits your deployment:
   - **Portable / headless daemons**: on any machine where you've signed into Claude Code with your Pro/Max account, run `claude setup-token` and store the result as a dicode secret named `CLAUDE_CODE_OAUTH_TOKEN`.
   - **Local daemon, already-logged-in host**: skip the secret. When `CLAUDE_CODE_OAUTH_TOKEN` is unset, the task omits it from the `claude` subprocess's env entirely, and the CLI falls back to reading `~/.claude/.credentials.json` — the same credential cache your interactive `claude` login already writes. dicode can't inspect that file from inside the Deno sandbox, so a genuine no-auth situation surfaces as the CLI's own auth error rather than a pre-flight failure.

2. **Install the `claude` binary on the daemon host.** Three paths depending on your deployment shape:
   - **Plain host** (laptops, single VMs): `curl -fsSL https://install.claude.ai | bash`. Make sure `~/.local/bin` is on the daemon's PATH.
   - **Custom Docker image**: build a derivative of `ghcr.io/dicode-ayo/dicode-core` that copies the binary in. The published image is distroless (no shell), so the actual install runs in a builder stage.
   - **Kubernetes init container**: an Alpine init container runs the installer into a shared `emptyDir`; the main dicode container reads from it via `CLAUDE_CLI_PATH`. No image rebuild required.

   Full Dockerfile and Pod spec recipes live in the [task README](https://github.com/dicode-ayo/dicode-core/blob/main/tasks/buildin/ai-agent-claude-cli/README.md).

3. **Verify** by hitting the task's webhook:
   ```sh
   curl -X POST http://localhost:8080/hooks/ai-claude \
     -H 'Content-Type: application/json' \
     -d '{"prompt":"In one sentence, what is dicode?"}'
   ```
   Response includes a `session_id`, but this one-shot call always starts a **fresh** Claude session — posting the id back on a later call does not resume it. For multi-turn conversation, use the [interactive chat](#interactive-chat) loop instead. True session resumption for the one-shot path is tracked in dicode-core [#751](https://github.com/dicode-ayo/dicode-core/issues/751) (not yet implemented).

   A turn that cannot run (CLI invocation failure, non-zero exit, an `is_error` response, …) is now a **failed run**, not a silently-green one: the task publishes `{ "ok": false, "error": "..." }` as the run's output and fails, so a webhook caller sees `status=failure` (HTTP 500 with that JSON body) instead of a `200` with an error string buried in `ok: false`.

### MCP tool access (no setup step needed)

Unlike the OAuth token above, MCP tool access isn't a step you have to perform: `DICODE_MCP_API_KEY` (also declared `optional: true` in `permissions.env`) is minted fresh by the daemon for every run of this task and revoked when the run ends — there's no [`dicode mcp install`](./mcp-server.md) to run first. As long as `enable_mcp` stays at its default `true`, each run gets `.claude/mcp.json` wired to dicode's `/mcp` endpoint and `--allowedTools mcp__dicode` automatically, on by default. Set `enable_mcp: false` to turn it off.

Independent of that switch, the task also always passes `--disallowedTools` denying Claude's built-in filesystem/bash/network tools (Bash, Read, Write, Edit, NotebookEdit, WebFetch, WebSearch, Glob, Grep, Task, KillShell) — fail-closed, whether or not MCP is wired. Turning `enable_mcp` off removes the `mcp__dicode` grant; it does not reopen access to Claude's own built-in tools. See [Limitations](#limitations-current).

This minted token is **not** a full-access credential — it's [scoped](./mcp-server.md#ephemeral-per-run-mcp-tokens) 1:1 to whatever `permissions.dicode` this task's own `task.yaml` declares. `list_tasks`/`get_task` require `permissions.dicode.list_tasks: true`; `run_task` requires the target task ID in `permissions.dicode.tasks` (or `["*"]`); `list_sources`, `switch_dev_mode`, and `test_task` are likewise gated on their own `sources_list`, `sources_set_dev_mode`, and `tasks_test` flags ([dicode-core#747](https://github.com/dicode-ayo/dicode-core/pull/747)). The shipped `buildin/ai-agent-claude-cli` `task.yaml` declares **no** `permissions.dicode` block at all, so out of the box the token Claude receives can't call any of the six MCP tools — every `tools/call` comes back a JSON-RPC error (`-32001`, capability not granted), not just the three that used to require `permissions.dicode`. To let this agent actually reach dicode's MCP surface, add a `permissions.dicode` block to its spec (typically via a taskset override layer) rather than assuming MCP access implies dicode-task access.

### Interactive chat

Calling the task with no `prompt` opens a multi-turn chat instead of the one-shot request/response shape: a fresh `dicode run buildin/ai-agent-claude-cli` (or a webhook POST with an empty/absent `prompt`) suspends into a `turn` step that reads one message, runs it through Claude, and suspends back to `turn` with the reply as the next prompt banner — a terminal-style chat built entirely on dicode's existing suspend/resume mechanism (`decideEntryMode`, `isChatEnd`), no changes to the `dicode` CLI itself. Send a blank message to end the chat. Claude's own CLI session — not a dicode KV entry — carries the conversation across turns; the per-chat working directory stays fixed across turns so `--resume` can find it.

A non-empty `prompt` on the initial call still bypasses the chat loop and runs the original one-shot path, returning `{ ok, reply, session_id, ... }` immediately — that behavior is unchanged.

### Plumbing into the auto-fix loop

The auto-fix preset's `ai_task` param selects which agent task drives the loop. Swap the OpenAI-compatible default for the Claude-CLI variant via a sibling override:

```yaml
auto-fix-claude:
  ref:
    path: ./auto-fix/task.yaml
  overrides:
    params:
      ai_task: "ai-agent-claude-cli"
    dicode:
      tasks: ["ai-agent-claude-cli", "git-pr"]
```

Then point `on_failure_chain` at `buildin/auto-fix-claude` instead of `buildin/auto-fix`. Same loop, different LLM backend, no marginal cost while you're under the 5-hour rate window.

### Webhook auth (session or HMAC)

`/hooks/ai-claude` ships with `trigger.auth: any`: a request authenticates with **either** a valid dicode session **or** a valid HMAC signature. See [Session authentication](/concepts/triggers#session-authentication) and [HMAC authentication](/concepts/triggers#hmac-authentication) for how each half works on its own — this section only covers what's specific to this builtin. (The general `trigger.auth: "any"` session-OR-HMAC mechanism is tracked separately in [dicode-site#140](https://github.com/dicode-ayo/dicode-site/issues/140); dicode-core [#615](https://github.com/dicode-ayo/dicode-core/pull/615) is what activates it on this particular webhook.)

- **Browser / WebUI chat** authenticates with your dicode session, directly on the daemon's own address. Session cookies never travel over the relay, so the chat UI is **not** reachable through the public relay URL — open it on the daemon's host, or reach the host with a tunnel (Tailscale, cloudflared). The UI assets (`index.html`, `chat.js`, `style.css`) always require a session; they never fall through to HMAC.
- **Machine / programmatic callers** sign a POST with a shared secret and can authenticate over the public [relay](./relay.md) URL, where session cookies can't reach.

Enable the HMAC path by setting the secret in the daemon environment:

```bash
export AI_CLAUDE_WEBHOOK_SECRET="$(openssl rand -hex 32)"
```

**Leaving it unset is safe.** A naive `webhook_secret: "${AI_CLAUDE_WEBHOOK_SECRET}"` would otherwise resolve, after template expansion, to the literal placeholder string when the variable is unset — a publicly-readable HMAC key shipped by default on an enabled-out-of-the-box webhook. dicode-core's `normalizeWebhookAuth` runs *after* template expansion (the only point a real secret is distinguishable from an unresolved one) and downgrades any `auth: any` webhook whose secret is empty or still `${...}`-shaped to plain **session-only** auth, clearing the placeholder and logging a load-time warning instead. So:

- `AI_CLAUDE_WEBHOOK_SECRET` **set** → `auth: any`, real HMAC, relay-reachable.
- **unset** → safe session-only fallback (today's original, unchanged behavior) — never a public-literal secret.

`require_timestamp: true` is also set on this webhook, so every signed request must carry a fresh `X-Dicode-Timestamp` alongside `X-Hub-Signature-256`. It's mandatory here — not just optional, as on a typical HMAC webhook — because this endpoint points an MCP-capable agent at the untrusted relay, and the timestamp closes the replay window:

```
X-Hub-Signature-256: sha256=HMAC-SHA256(secret, "<unix_ts>\n<body>")
X-Dicode-Timestamp: <unix_ts>
```

::: warning Relay caveat — short/programmatic turns only
The relay forwarder aborts at **25s**, but a chat turn can run up to 5 minutes, and `?wait=false` can't be selected over the relay (the broker drops query strings). A long synchronous turn over the relay will still 502 regardless of auth — enabling the HMAC path makes the webhook *reachable*, not necessarily *completable* for long turns. Use it for short or fire-and-forget turns until an async, pollable surface lands.
:::

### Limitations (current)

- **Partially governed tool access (security).** `claude -p` print mode actually runs with Claude's full default toolset (Read/Write/Edit/Bash/etc.) — it is not tool-free, contrary to an earlier assumption in this doc. The wrapper compensates by always passing `--disallowedTools` denying the dangerous built-ins (Bash, Read, Write, Edit, NotebookEdit, WebFetch, WebSearch, Glob, Grep, Task, KillShell), fail-closed, regardless of whether MCP wiring succeeded. When MCP is wired (the default; see [MCP tool access](#mcp-tool-access-no-setup-step-needed)), the task additionally passes `--allowedTools mcp__dicode` so Claude can call dicode's governed tool surface; setting `enable_mcp: false` drops that grant, but the built-in denylist still applies either way. As a subprocess, `claude` is still not confined by dicode's Deno sandbox, so the `run: ["claude"]` permission still understates what the binary itself can do at the OS level — but it can no longer reach host filesystem/bash/network tools through Claude's own tool-call interface. Growing the MCP surface to more governed authoring tools (write-into-clone, test, commit/PR) is still open, tracked in dicode-core [#560](https://github.com/dicode-ayo/dicode-core/issues/560).
- **No streaming.** The wrapper waits for the full response before returning. Plumbing `--output-format stream-json` through `dicode.output()` is a tracked follow-up.
- **No subscription-aware queueing.** Hitting the 5-hour cap returns an error; the task has no built-in retry or backpressure.
- **One subscription per dicode instance.** OAuth tokens belong to one Claude account — fine for personal/team setups, less suited to multi-tenant.

## Follow-up work

The v1 buildin is deliberately minimal. Tracked follow-ups:

- **Streaming tokens** — the dashboard already WebSocket-broadcasts run logs; a streaming chat UI is an additive change.
- **History rehydration on reload** — needs a way for the browser to read the task's KV.
- **Generic `dicode chat` REPL** — `buildin/ai-agent-claude-cli` already has an interactive chat mode today (see [Interactive chat](#interactive-chat)): an empty `prompt` opens a suspend/resume loop over `dicode run`, ending on a blank message. What's still open is a *generic* `dicode chat [preset]` command that gives the same REPL experience against any `ai-agent`-shaped task (including the OpenAI-compatible `buildin/ai-agent`), with `session_id` persisted in a dotfile instead of carried in suspend state.

### Zero-paste onboarding with `if_missing`

The `ai-agent-openrouter` preset chains a local PKCE OAuth task via the `if_missing` directive on its API-key env entry: the first time a user hits the chat with no `OPENROUTER_API_KEY` stored, the engine runs [`auth/openrouter-oauth`](../getting-started/configuration) before the real task, which surfaces an authorize URL. One browser click stores the key; every subsequent message skips the prereq and runs normally. No relay, no broker, no app registration — OpenRouter's flow accepts an arbitrary `callback_url` as a request parameter. See the [Secrets concepts page](./secrets#running-a-prereq-task-when-a-secret-is-missing) for the general mechanism.
