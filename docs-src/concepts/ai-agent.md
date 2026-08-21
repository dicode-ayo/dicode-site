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
- **Skills** — markdown files under `tasks/skills/` that get loaded into the agent's system prompt. Think of them as domain knowledge the agent should always have in context: runbooks, glossaries, team conventions.
- **Persistent sessions** — conversations are keyed by `session_id` and stored in KV. Pass your own id to resume, or omit it to have the task generate and return one.
- **Lazy history compaction** — when a conversation exceeds `max_history_tokens`, older turns are replaced by a running summary generated via a second model call. The buildin stays snappy on long conversations without silently losing context.
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
| **Skill** | A markdown file with domain context | `tasks/skills/*.md` | Concatenated into the system prompt at the start of every turn |

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

Skills are loaded eagerly — every name you pass is read and concatenated into the system prompt for the entire turn. Missing or unreadable skills produce a placeholder in the prompt instead of failing the request.

A starter skill ships at `tasks/skills/dicode-basics.md` covering core dicode concepts an agent should know to be useful.

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
| **Open** | `dicode task create <name> [--ai "PROMPT"]` (new task) or `dicode task edit <task-id> ["PROMPT"]` (existing) opens a session. The session ID is printed to stderr; the task ID is printed to stdout. Files in the session start as copies of the current task (edit) or an empty scaffold (create). |
| **Edit** | The AI or user writes files into the session via IPC or REST. Each write is immediately reflected in the WebUI's diff view. |
| **Validate** | Optional — `task.yaml` is parsed and linted against the task schema. Validation errors are returned without closing the session. |
| **Save** | `dicode task save <session-id>` commits the draft files to the configured git source. The reconciler picks up the change within ~1 s. |
| **Cancel** | `dicode task cancel <session-id>` discards the draft. No git change is made. |

Session files are stored in the daemon's data directory (not in git) until save is called. Sessions are automatically expired after 24 hours if neither save nor cancel is called.

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

### REST API

For custom integrations or AI agent tool-call paths, the same lifecycle is available over HTTP. All routes are under `/api/` and require authentication (session cookie or `Authorization: Bearer <api-key>`). Session IDs are passed in the JSON request body.

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/task/create` | `{"name": "<name>", "source": "<source>"}` | Create a new task scaffold and open an authoring session. Returns `{"task_id": "...", "source": "...", "files": [...]}`. |
| `POST` | `/api/task/edit` | `{"task_id": "<id>"}` or `{"session_id": "<sid>", "task_id": "<id>"}` | Open (or resume) an edit session for an existing task. Returns `{"session_id": "...", "sandbox_path": "...", "source": "...", "source_kind": "..."}`. |
| `POST` | `/api/task/save` | `{"session_id": "<sid>"}` | Commit the session's files to the git source and close the session. Returns `{"applied": true}`. |
| `POST` | `/api/task/cancel` | `{"session_id": "<sid>"}` | Discard the session. Returns `{"cancelled": true}`. |

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
   Response includes a `session_id` you pass back to continue the conversation.

### MCP tool access (no setup step needed)

Unlike the OAuth token above, MCP tool access isn't a step you have to perform: `DICODE_MCP_API_KEY` (also declared `optional: true` in `permissions.env`) is minted fresh by the daemon for every run of this task and revoked when the run ends — there's no [`dicode mcp install`](./mcp-server.md) to run first. As long as `enable_mcp` stays at its default `true`, each run gets `.claude/mcp.json` wired to dicode's `/mcp` endpoint and `--allowedTools mcp__dicode` automatically, on by default. Set `enable_mcp: false` to turn it off.

Independent of that switch, the task also always passes `--disallowedTools` denying Claude's built-in filesystem/bash/network tools (Bash, Read, Write, Edit, NotebookEdit, WebFetch, WebSearch, Glob, Grep, Task, KillShell) — fail-closed, whether or not MCP is wired. Turning `enable_mcp` off removes the `mcp__dicode` grant; it does not reopen access to Claude's own built-in tools. See [Limitations](#limitations-current).

This minted token is **not** a full-access credential — it's [scoped](./mcp-server.md#ephemeral-per-run-mcp-tokens) 1:1 to whatever `permissions.dicode` this task's own `task.yaml` declares. `list_tasks`/`get_task` require `permissions.dicode.list_tasks: true`; `run_task` requires the target task ID in `permissions.dicode.tasks` (or `["*"]`). The shipped `buildin/ai-agent-claude-cli` `task.yaml` declares **no** `permissions.dicode` block at all, so out of the box the token Claude receives can't call any of those three tools — Claude only sees the always-allowed hint tools (`list_sources`, `switch_dev_mode`, `test_task`), and even the REST endpoint that last one points at (`POST /api/tasks/{id}/test`) is separately 403'd unless `permissions.dicode.tasks_test: true` is also declared. To let this agent actually list or trigger dicode tasks over MCP, add a `permissions.dicode` block to its spec (typically via a taskset override layer) rather than assuming MCP access implies dicode-task access.

### Skills installation layout

This is a different mechanism from the `tasks/skills/*.md` system in [Tools vs skills](#tools-vs-skills) above — that one is `buildin/ai-agent`'s flat directory of markdown files concatenated into the system prompt. `buildin/ai-agent-claude-cli`'s `skills` param instead **installs** skills onto disk, in the layout the Claude CLI itself auto-loads project skills from.

Each comma-separated name in `skills` (no `.md` suffix) is installed into `.claude/skills/<name>/SKILL.md` inside the task's working directory for that invocation — the same `.claude/`-rooted directory covered in [Interactive chat](#interactive-chat) below, which for a multi-turn chat is keyed by chat id and stays fixed across turns. This matters because the Claude CLI only auto-loads a project skill from a *directory* holding `SKILL.md` — a flat `.claude/skills/<name>.md` file (the layout this task used before dicode-core [#744](https://github.com/dicode-ayo/dicode-core/pull/744)) is silently ignored by the CLI, so nothing named in `skills` ever reached a session even though the run log reported it wired.

Before installing, the task validates each skill's source document — read as `<name>.md` from `skills_dir` (default `${TASK_SET_DIR}/../skills`) — against what the CLI itself requires: valid YAML frontmatter with a `name` that matches the skill name exactly and a non-empty `description`. If the frontmatter is missing, malformed, or its `name` disagrees with the skill name, the skill is dropped with a warning instead of installed — and it does not count toward the run's wired-skills total, so a dropped skill can't silently look wired in the logs.

Because that working directory persists across turns of the same conversation (keyed by chat id), a skill removed from a later turn's `skills` param is also uninstalled from it rather than left behind — otherwise a stale `SKILL.md` from an earlier turn would keep loading even after you dropped it from the request.

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
