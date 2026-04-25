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

When `server.auth: true` (the recommended deployment mode), calls to `/mcp` require an API key as a Bearer token. Generate one in the WebUI:

1. Open the dashboard, go to **Security**
2. Click **Create API Key**, give it a name
3. Copy the raw key — it's shown **once** at creation, only its hash is stored

Pass it in the `Authorization` header on every MCP call. Revoke from the same page when a key leaks.

When `server.auth: false`, `/mcp` is open to anyone who can reach the port — the same trust model as the rest of the API.

## Tool surface

The MCP server exposes six tools. Three are direct passthroughs to the dicode SDK; three return structured hints pointing at the dicode HTTP API for operations that aren't (yet) exposed to tasks.

| Tool | What it does | Backed by |
|---|---|---|
| `list_tasks` | Returns all registered tasks with their IDs, names, descriptions, and declared params. | `dicode.list_tasks()` |
| `get_task` | Returns the spec for a single task. | `dicode.list_tasks()` filtered by id |
| `run_task` | Triggers a task by ID and waits for it to finish. Returns the run result. | `dicode.run_task()` |
| `list_sources` | Hint: call `GET /api/sources` directly. | — |
| `switch_dev_mode` | Hint: call `PATCH /api/sources/{name}/dev` directly. | — |
| `test_task` | Hint: call `POST /api/tasks/{id}/test` directly. | — |

The "hint" tools intentionally don't proxy. Every MCP client already has the dicode API key (it's how it reached `/mcp`), so when it needs to manage sources or run task tests, it calls the corresponding REST endpoint directly with the same key — one less round-trip than going through MCP.

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

Claude Code reads MCP servers from your user config. Add via the CLI:

```sh
claude mcp add --transport http dicode http://localhost:8080/mcp \
  --header "Authorization: Bearer dck_..."
```

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

- The buildin/mcp task declares `permissions.dicode.tasks: ["*"]` — once authenticated, an MCP client can call `run_task` on any registered task. This is the intended design: MCP is a privileged surface. Don't expose `/mcp` to untrusted networks.
- The buildin task uses `trigger.auth: true` to close the bypass where an unauthenticated caller could post directly to `/hooks/mcp` and skip the API-key gate. The `/mcp` forwarder bypasses session auth and uses Bearer keys, so MCP clients are unaffected.
- API keys are stored as SHA-256 hashes — losing your dicode database doesn't expose the raw keys, but losing one of the keys in transit *does* mean someone can fire any task. Treat them like SSH keys.
