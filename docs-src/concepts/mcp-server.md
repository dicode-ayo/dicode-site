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

The MCP server exposes six tools, and every one of them is backed directly by a dicode SDK call — none return hint-only prose telling the caller to make the HTTP request itself. (This wasn't always true: `switch_dev_mode`, `test_task`, and `list_sources` used to be non-acting hint tools — see [dicode-core#747](https://github.com/dicode-ayo/dicode-core/pull/747).)

| Tool | What it does | Backed by |
|---|---|---|
| `list_tasks` | Returns MCP-exposed tasks with their IDs, names, descriptions, and declared params. Only tasks with `mcp_exposed: true` in their `task.yaml` appear — all others are hidden from MCP by default. | `dicode.list_tasks()` |
| `get_task` | Returns the spec for a single task. The task must have `mcp_exposed: true`; querying a non-exposed task returns an error. | `dicode.list_tasks()` filtered by id |
| `run_task` | Triggers a task by ID and waits for it to finish. Returns the run result. The task must have `mcp_exposed: true`; invoking a non-exposed task returns an error. | `dicode.run_task()` |
| `list_sources` | Returns the configured sources, sorted by name. Host filesystem paths are withheld from the response — `switch_dev_mode` is the only tool that hands back a path, and only for the clone it just created. Gated on `permissions.dicode.sources_list`. | `dicode.sources.list()` |
| `switch_dev_mode` | Enters or leaves dev mode on a TaskSet source. `local_path` is not an accepted argument on this tool — it would let a caller redirect the daemon's taskset resolution at an arbitrary host path; use `PATCH /api/sources/{name}/dev` for local-path dev mode instead. For a scoped [ephemeral per-run token](#ephemeral-per-run-mcp-tokens), `run_id` is bound server-side to the run the token was minted for — the `/mcp` handler overwrites whatever the call carries (see the capability-scoped info box below for the exact behavior when no run is bound); a durable operator/CLI/dashboard key is unscoped and still supplies its own `run_id`. Gated on `permissions.dicode.sources_set_dev_mode`. | `dicode.sources.set_dev_mode()` |
| `test_task` | Runs the task's sibling test file (`task.test.ts` / `task.test.js` / `task.test.py`) and returns pass/fail counts and output. Refused for a task the approval gate is still holding pending — the test file runs with full host permissions, so a pending task is turned away here exactly as it would be on a fire. Gated on `permissions.dicode.tasks_test` — the same flag also gates the REST endpoint `POST /api/tasks/{id}/test`, reachable with the same Bearer token, so the two share one gate. | `dicode.tasks.test()` |

::: warning Tasks must opt in to MCP exposure
By default, tasks are **hidden** from MCP clients. To make a task visible to `list_tasks` and invokable via `tools/call`, set `mcp_exposed: true` in its `task.yaml`. This prevents unintended exposure of internal tasks to MCP clients. Calling `get_task` or `run_task` on a non-exposed task returns a JSON-RPC error. See [Tasks — `mcp_exposed`](./tasks.md#field-reference) for the field reference.
:::

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

- `list_tasks` / `get_task` require the task to declare `permissions.dicode.list_tasks: true`.
- `run_task` requires the target task ID to appear in the task's own `permissions.dicode.tasks` (or `["*"]` for any task).
- `list_sources` requires `permissions.dicode.sources_list: true`.
- `switch_dev_mode` requires `permissions.dicode.sources_set_dev_mode: true`, and additionally requires the token to carry the run it was minted for — a token without one is refused rather than allowed to supply its own `run_id`.
- `test_task` requires `permissions.dicode.tasks_test: true`.

A task with no `permissions.dicode` block at all gets a token that can call none of the scoped tools above. An unrecognized tool name is denied by default too, so a tool added to the `buildin/mcp` dispatcher without a matching scope-check case fails closed rather than inheriting full access. Enforcement happens in the `/mcp` handler *before* the request reaches the `buildin/mcp` task — the task holds the dicode permissions every tool it serves needs, so it isn't relied on to self-restrict — and a denied call comes back as a JSON-RPC error (HTTP 200, `error.code: -32001`) rather than being silently forwarded. This shipped in dicode-core [#589](https://github.com/dicode-ayo/dicode-core/pull/589); `list_sources`, `switch_dev_mode`, and `test_task` moved from always-allowed hint tools onto this same capability-gated model in [#747](https://github.com/dicode-ayo/dicode-core/pull/747).

**The `test_task` / REST split.** `test_task` now acts directly — it runs the target task's sibling test file and returns the result, same as `dicode.tasks.test()`, instead of pointing the caller at REST. The REST endpoint `POST /api/tasks/{id}/test` is still a separate surface, still reachable with the same Bearer token, but it checks the identical `permissions.dicode.tasks_test` flag ([#627](https://github.com/dicode-ayo/dicode-core/pull/627)) — so the JSON-RPC tool and the REST endpoint now carry one gate between them, rather than the JSON-RPC side being unconditionally open while only the REST side was checked. Scoping the JSON-RPC tools does not, by itself, scope every REST endpoint reachable with the same token — `tasks_test` is the one other case covered today.

**`switch_dev_mode`'s removed `local_path` and server-bound `run_id`.** `local_path` is no longer an accepted argument on the MCP tool. Taskset resolution reads a ref's `auth.token_env` from the daemon environment, and that read happens before the approval gate runs — so letting a caller redirect resolution at an arbitrary host path would have reached that credential-bearing step unapproved. Operators who need local-path dev mode use `PATCH /api/sources/{name}/dev` instead. `run_id` is bound server-side to the run the token was minted for — the `/mcp` handler rewrites whatever the call carries before forwarding, so one session cannot address another session's dev-mode clone by supplying a different `run_id`.

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
- An **ephemeral per-run token** (see [Ephemeral per-run MCP tokens](#ephemeral-per-run-mcp-tokens) above) does *not* inherit that full access — it's capability-scoped to its minting task's own `permissions.dicode`, including the `sources_list`, `sources_set_dev_mode`, and `tasks_test` flags, the last of which also gates the REST endpoint `POST /api/tasks/{id}/test`. Don't assume every Bearer token on `/mcp` carries the same privileges; check whether it's a durable key or an ephemeral one.
- The buildin task uses `trigger.auth: true` to close the bypass where an unauthenticated caller could post directly to `/hooks/mcp` and skip the API-key gate. The `/mcp` forwarder bypasses session auth and uses Bearer keys, so MCP clients are unaffected.
- API keys are stored as SHA-256 hashes — losing your dicode database doesn't expose the raw keys, but losing one of the keys in transit *does* mean someone can fire any task. Treat them like SSH keys.
