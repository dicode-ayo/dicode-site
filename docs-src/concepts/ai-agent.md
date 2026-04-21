# AI Agent

Dicode ships a built-in **ai-agent** task that provides a full chat interface where an AI model can call your other dicode tasks as tools. Open it like any other webhook task — navigate to `/hooks/ai` in the dashboard — and you're talking to a model that can actually *do* things in your dicode install, not just generate text.

This is a complement to dicode's [AI task generation](./sdk) feature. AI generation helps you *author* tasks; the agent helps you *operate* them.

## AI at every stage

Most automation tools stop at "AI helps you write code." dicode puts AI at every stage of the task lifecycle:

| Stage | What AI does | How it works |
|-------|-------------|--------------|
| **Create** | Generates task.yaml + task.ts from plain English | `dicode generate "monitor my API every 5 min"` — AI writes validated code, commits to git |
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

## Follow-up work

The v1 buildin is deliberately minimal. Tracked follow-ups:

- **Streaming tokens** — the dashboard already WebSocket-broadcasts run logs; a streaming chat UI is an additive change.
- **History rehydration on reload** — needs a way for the browser to read the task's KV.
- **CLI chat** — `dicode chat [preset]` as a REPL, `session_id` persisted in a dotfile.
- **Zero-paste OAuth onboarding** via OpenRouter PKCE through the dicode-relay broker.
