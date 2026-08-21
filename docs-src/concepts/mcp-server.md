# MCP Server

dicode is itself an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server. Any MCP-capable client — Claude Code, Claude Desktop, Cursor, your own agent — can connect to your dicode install and use it as a tool surface for listing, inspecting, and triggering tasks.

This is the inverse of the [`mcp` SDK global](./sdk#mcp): that one lets a *task* call *external* MCP servers; this one lets *external clients* call into *dicode*.

## Endpoint

```
POST http://<your-dicode>/mcp
Authorization: Bearer <api-key>
Content-Type: application/json
```

Speaks JSON-RPC 2.0 over a single POST per call. The same shape every MCP client speaks — no special transport, no streaming, no websockets. `GET /mcp` returns a small server-info doc so a probe lands cleanly.

## Authentication

`/mcp` requires a `dck_` API key (Bearer) when `server.auth: true`:

```
Authorization: Bearer dck_...
```

**A Bearer API key is the only supported mechanism** for `/mcp` — every MCP client uses it, machine clients, agents, CI, and browser-based tooling alike, with no session-cookie fallback even for browser-based callers. Generate one in the WebUI:

1. Open the dashboard, go to **Security**
2. Click **Create API Key**, give it a name
3. Copy the raw key — it's shown **once** at creation, only its hash is stored

Pass it in the `Authorization` header on every MCP call:

```sh
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer dck_..." \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
```

Revoke from the same Security page when a key leaks.

When `server.auth: false`, `/mcp` is open to anyone who can reach the port — the same trust model as the rest of the API. Note that with `auth: false` the daemon binds to `127.0.0.1` by default; see [`server.host`](/getting-started/configuration#bind-address-server-host) if you need network access.

## Tool surface

The MCP server exposes twelve tools, gated in two different ways. `list_sources` carries no gate at all. `get_task` and `run_task` predate dicode-core#746's mechanism: they always appear in `tools/list`, but each *call* is checked against the caller's `permissions.dicode.list_tasks` (`get_task`) or `.tasks` (`run_task`, target ID must be listed) — an ungranted caller still sees the tool, and only gets denied when it actually calls it. The remaining nine `dicode_`-prefixed tools work differently: dicode-core [#746](https://github.com/dicode-ayo/dicode-core/pull/746) gates them at *listing* time, so an undeclared capability makes the tool invisible from `tools/list` entirely rather than a permission error discovered by calling it.

| Tool | What it does | Backed by | Requires capability |
|---|---|---|---|
| `get_task` | Returns the spec for a single task. The task must have `mcp_exposed: true`; querying a non-exposed task returns an error. | `dicode.list_tasks()` filtered by id | `list_tasks` (checked per-call; tool stays listed regardless) |
| `run_task` | Triggers a task by ID and waits for it to finish. Returns the run result. The task must have `mcp_exposed: true`; invoking a non-exposed task returns an error. | `dicode.run_task()` | `tasks` (target ID must be listed; checked per-call, tool stays listed regardless) |
| `list_sources` | Hint: call `GET /api/sources` directly. | — | — |
| `dicode_list_tasks` | Returns MCP-exposed tasks with their IDs, names, descriptions, and declared params. Only tasks with `mcp_exposed: true` in their `task.yaml` appear — all others are hidden from MCP by default. | `dicode.list_tasks()` | `list_tasks` |
| `dicode_get_runs` | Returns recent run records (status, timing, output) for a task. | `dicode.get_runs()` | `get_runs` |
| `dicode_test_task` | Runs a task's sibling test file with full host permissions and returns the result — a real call now, not a pointer to `POST /api/tasks/{id}/test`. | `dicode.tasks.test()` | `tasks_test` |
| `dicode_set_dev_mode` | Toggles dev mode on a source in **clone-mode only** (the MCP tool doesn't expose `local_path`, which would otherwise let a caller redirect the daemon's taskset resolution at an arbitrary host path). Returns `{ok, dev_root_path, clone_path}` — previously just `{ok: true}`, which left a caller holding a clone it had no way to locate. | `dicode.sources.set_dev_mode()` | `sources_set_dev_mode` |
| `dicode_get_run_input` | Reads another run's persisted input — used to inspect what triggered a failure before replaying it. | `dicode.runs.get_input()` | `runs_get_input` |
| `dicode_pin_run_input` / `dicode_unpin_run_input` | Pins a run's persisted input so the retention sweeper won't delete it mid-loop, or releases that hold. | `dicode.runs.pin_input()` / `dicode.runs.unpin_input()` | `runs_pin_input` / `runs_unpin_input` |
| `dicode_replay_run` | Re-fires a task using a previously recorded (typically pinned) input. | `dicode.runs.replay()` | `runs_replay` |
| `dicode_git_commit_push` | Commits and pushes staged changes from a dev-mode clone. Commit author is defaulted by the daemon; the model can't set `allow_main` — `branch_prefix` is required instead, so a per-call bypass of the main/master guard isn't the caller's decision. | `dicode.git.commit_push()` | `git_commit_push` |

::: warning Tasks must opt in to MCP exposure
By default, tasks are **hidden** from MCP clients. To make a task visible to `dicode_list_tasks` and invokable via `tools/call`, set `mcp_exposed: true` in its `task.yaml`. This prevents unintended exposure of internal tasks to MCP clients. Calling `get_task` or `run_task` on a non-exposed task returns a JSON-RPC error. See [Tasks — `mcp_exposed`](./tasks.md#field-reference) for the field reference.
:::

`list_sources` is the one tool that still intentionally doesn't proxy — every MCP client already has the dicode API key (it's how it reached `/mcp`), so when it needs to manage sources it calls `GET /api/sources` directly with the same key, one less round-trip than going through MCP. `switch_dev_mode` and `test_task` used to work the same way; as of dicode-core#746 they're real, capability-gated tools (`dicode_set_dev_mode`, `dicode_test_task`) that execute directly instead of pointing the caller at a REST endpoint.

## Configure Claude Desktop

Claude Desktop's MCP config lives at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows). Add a `mcpServers` entry:

```json
{
  "mcpServers": {
    "dicode": {
      "url": "http://localhost:8080/mcp",
      "headers": {
        "Authorization": "Bearer dck_..."
      }
    }
  }
}
```

Restart Claude Desktop. The dicode tools should appear in the tools panel.

## Configure Cursor

Cursor's MCP config lives in `.cursor/mcp.json` (per project) or your global Cursor config. Same shape:

```json
{
  "mcpServers": {
    "dicode": {
      "url": "http://localhost:8080/mcp",
      "headers": {
        "Authorization": "Bearer dck_..."
      }
    }
  }
}
```

## Configure Claude Code (CLI)

Three ways, pick whichever feels best:

### 1. Dashboard one-click

Security → **Create API Key**. The success card has a "Connect to Claude Code" expander with the install command pre-filled with the new key. Copy → paste into a terminal where `claude` is installed → done.

### 2. `dicode mcp install`

The dicode CLI ships a helper that **mints a fresh API key in the daemon** and runs `claude mcp add` for you — zero-touch:

```sh
dicode mcp install
# → mints "mcp-dicode" in the daemon's secrets store
# → runs: claude mcp add --transport http dicode http://localhost:8080/mcp \
#                       --header "Authorization: Bearer dck_..."
```

Re-running `install` rotates the key (revokes the previous one with the same name first, mints a new one). To uninstall:

```sh
dicode mcp uninstall          # revokes the key + runs `claude mcp remove dicode`
```

Or use a key you already minted:

```sh
dicode mcp install --key dck_...     # skips the daemon mint
```

Other helpers:

```sh
dicode mcp print-config       # prints command + .claude/mcp.json snippet, no mint, no shell-out
dicode mcp install --print    # rehearse — print the would-be command without running
```

The mint goes through the daemon's control socket; the daemon must be running. After the key is in hand, `claude mcp add` itself doesn't need the dicode daemon to be up — it just writes to the local Claude Code config.

### 3. Manual `claude mcp add`

Mint a key in the dashboard, then:

```sh
claude mcp add --transport http dicode http://localhost:8080/mcp \
  --header "Authorization: Bearer dck_..."
```

## Ephemeral per-run MCP tokens

Everything above is a human provisioning one durable key up front. There's a second path aimed at tasks rather than people: a task can opt in to an **automatic, per-run token** that the daemon mints and revokes for it, with no `dicode mcp install` step and no key to copy anywhere.

### Opt in via `permissions.env`

Declare an env entry named `DICODE_MCP_API_KEY` in the task's `task.yaml`. In practice this is written as a `secret:` entry, typically with `optional: true` so the run doesn't fail before the daemon has a chance to inject the ephemeral token — this is exactly how `buildin/ai-agent-claude-cli` declares it:

```yaml
permissions:
  env:
    - name: DICODE_MCP_API_KEY
      secret: DICODE_MCP_API_KEY
      optional: true
```

A task that declares an env entry named `DICODE_MCP_API_KEY` gets special handling: instead of resolving the value normally, the daemon mints a fresh, single-run dicode API key when the run starts, injects it as `DICODE_MCP_API_KEY` (overriding whatever the entry would otherwise have resolved to), and unconditionally revokes it when the run ends — on success, on error, and on timeout. The task hands that key to whatever MCP client it drives (its own HTTP call, or a wrapped CLI) to reach dicode's `/mcp` surface with zero setup. This is the mechanism `buildin/ai-agent-claude-cli` uses — see [AI Agent](./ai-agent).

If no minter is wired (no database configured — the case in some test/dev setups), the ephemeral mint is skipped and the entry resolves normally instead: a `secret:` entry falls back through the secrets chain, and `optional: true` degrades a missing secret to an empty string rather than failing the run. A **bare** `DICODE_MCP_API_KEY` entry (no `secret:`/`from:`/`value:`) does *not* fall back to anything — dicode always excludes this name from bare host-env passthrough as a daemon control-plane credential, so with no minter wired it would resolve to nothing. Use the `secret:` + `optional: true` form shown above, not a bare entry.

### How it differs from `dicode mcp install`

| | `dicode mcp install` | Ephemeral per-run token |
|---|---|---|
| Lifetime | Durable — lives until re-run or `dicode mcp uninstall` | Single run — minted at start, revoked at end |
| Scope of the key itself | One shared key, reused by every call that has it | Private to one run; a new run gets a new key |
| Who provisions it | An operator, once, from a terminal | The daemon, automatically, on every run |
| Key name | `mcp-dicode` (or your own via `--key`) | `ephemeral/run/<runID>` |
| Cleanup | Manual — rotate or uninstall | Automatic revoke on run end, plus a daemon-startup sweep that revokes any token orphaned by a run that was still in flight when the daemon last stopped |

Reach for `dicode mcp install` when a human is sitting at a `claude` CLI session. Reach for the ephemeral path — via `permissions.env` — when a task itself needs to call dicode's MCP tools as part of its own run.

::: info Capability-scoped, not full-surface
The minted token is **scoped 1:1 to the task's own declared `permissions.dicode`** — it never authorizes more than the task could already do directly:

- `get_task` / `run_task` require the task to declare `permissions.dicode.list_tasks: true` (for `get_task`) and the target task ID in `permissions.dicode.tasks` (for `run_task`, or `["*"]` for any task). Both tools stay visible in `tools/list` either way — the check happens at call time (pre-dates #746, unchanged by it).
- `list_sources` stays an always-allowed hint tool — it exercises no dicode capability itself.
- Every `dicode_`-prefixed tool from the [tool surface table](#tool-surface) above is gated on its own matching capability: `dicode_list_tasks` needs `list_tasks`, `dicode_test_task` needs `tasks_test`, `dicode_set_dev_mode` needs `sources_set_dev_mode`, and so on down the table. An undeclared capability makes the tool **invisible** to the caller — it never appears from `tools/list` — rather than a permission error discovered by calling it (dicode-core [#746](https://github.com/dicode-ayo/dicode-core/pull/746)).

A task with no `permissions.dicode` block at all gets a token that still sees `get_task`/`run_task` listed but has every call to either denied, and sees none of the nine capability-gated `dicode_*` tools at all — only the always-allowed `list_sources` hint stays fully usable. Enforcement happens in the `/mcp` handler *before* the request reaches the `buildin/mcp` task, so a denied call comes back as a JSON-RPC error (HTTP 200, `error.code: -32001`) rather than being silently forwarded. This mechanism shipped in dicode-core [#589](https://github.com/dicode-ayo/dicode-core/pull/589) and was extended to the full `dicode_*` set by [#746](https://github.com/dicode-ayo/dicode-core/pull/746).

**`dicode_test_task` no longer splits from REST.** Before #746, the JSON-RPC `test_task` call was an unconditionally-allowed hint pointing at `POST /api/tasks/{id}/test`, which was itself separately gated on `permissions.dicode.tasks_test: true` ([#627](https://github.com/dicode-ayo/dicode-core/pull/627)) — so a token could see the hint but still get a 403 from the endpoint it pointed to. `dicode_test_task` now carries the same `tasks_test` gate directly: a token without that capability doesn't see the tool at all, and one that does see it gets the same result the REST endpoint would give.

Operator-, CLI-, and dashboard-created API keys (`dicode mcp install`, the dashboard's **Create API Key**) remain **unscoped** — full access, same as before this feature — since they aren't tied to a single task's declared permissions.
:::

## Try it from the shell

```sh
# server-info probe
curl http://localhost:8080/mcp

# initialize
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer dck_..." \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'

# list tools
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer dck_..." \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# fire a task
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer dck_..." \
  -H "Content-Type: application/json" \
  -d '{
        "jsonrpc":"2.0",
        "id":3,
        "method":"tools/call",
        "params":{
          "name":"run_task",
          "arguments":{"id":"infra/deploy","params":{"env":"staging"}}
        }
      }'
```

## How it's implemented

Unlike most MCP servers — which ship as a separate process — dicode's MCP surface is **itself a dicode task**. The buildin/mcp task at [`tasks/buildin/mcp/`](https://github.com/dicode-ayo/dicode-core/tree/main/tasks/buildin/mcp) is a Deno webhook that receives the JSON-RPC body, dispatches to the right tool, and returns the response. The `/mcp` URL in the WebUI is a thin API-key-gated forwarder onto `/hooks/mcp`.

Why this matters: editing the MCP surface is just editing a task. Want a custom tool? Fork the buildin, add a case to the dispatcher. Want to gate certain tools on a different auth scheme? Wrap the task. The same hot-reload flow that applies to your own tasks applies to dicode's MCP surface — no rebuild, no daemon restart.

## Disabling MCP

Set `server.mcp: false` in `dicode.yaml` to take the `/mcp` URL down. The buildin/mcp task itself stays loaded (so internal tools that depend on the same dispatch logic keep working), but the public URL returns 404. Restart the daemon to apply.

## Security notes

- The buildin/mcp task declares `permissions.dicode.tasks: ["*"]` — the task itself always runs with full `list_tasks`/`run_task` permissions and isn't relied on to self-restrict. With a durable **operator-, CLI-, or dashboard-issued** key, an authenticated MCP client can call `run_task` on any registered task. This is the intended design for those keys: MCP is a privileged surface. Don't expose `/mcp` to untrusted networks.
- An **ephemeral per-run token** (see [Ephemeral per-run MCP tokens](#ephemeral-per-run-mcp-tokens) above) does *not* inherit that full access — it's capability-scoped to its minting task's own `permissions.dicode`, including the `tasks_test` gate shared by `dicode_test_task` and `POST /api/tasks/{id}/test`. Don't assume every Bearer token on `/mcp` carries the same privileges; check whether it's a durable key or an ephemeral one.
- The buildin task uses `trigger.auth: true` to close the bypass where an unauthenticated caller could post directly to `/hooks/mcp` and skip the API-key gate. The `/mcp` forwarder bypasses session auth and uses Bearer keys, so MCP clients are unaffected.
- API keys are stored as SHA-256 hashes — losing your dicode database doesn't expose the raw keys, but losing one of the keys in transit *does* mean someone can fire any task. Treat them like SSH keys.
