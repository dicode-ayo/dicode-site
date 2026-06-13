# Security & Audit Log

## Audit Log

dicode records security-sensitive operations to an `audit_log` table in the database. The log captures who triggered what, which tasks and MCP tools were invoked (both allowed and denied), and all auth failures — with secret and environment variable values redacted.

### What gets logged

Four categories of events are emitted:

| Event type | When |
|---|---|
| `run_triggered` | Every task trigger — cron, webhook, manual, chain, daemon, replay |
| `task_called` | Every `dicode.run_task` IPC call from a task script; logged whether allowed or denied |
| `mcp_called` | MCP `tools/call` requests and outbound `mcp.call` to external servers |
| `denied` | Auth failures: invalid session, wrong API key, failed passphrase login, webhook auth rejection |

### Redaction

Sensitive values in logged parameters are replaced with `[REDACTED]`:

- Keys matching a deny-list (e.g. `password`, `secret`, `token`, `key`, `api_key`)
- Values that are `env:`, `secret:`, or `secrets:` references

Nested MCP arguments are walked recursively with a depth cap.

### Querying audit events

```
GET /api/audit
```

Requires authentication (session cookie or Bearer API key).

| Query param | Description |
|---|---|
| `task_id` | Filter by task ID (exact match) |
| `actor` | Filter by actor identifier |
| `event_type` | Filter by event type (`run_triggered`, `task_called`, `mcp_called`, `denied`) |
| `limit` | Max results (default 100, cap 1000) |
| `offset` | Pagination offset |

Results are returned newest-first as a JSON array. Each entry includes `id`, `ts`, `event_type`, `actor_id`, `task_id`, `run_id`, `allowed`, `params`, and `reason`.

### Retention

Configure retention in `dicode.yaml`:

```yaml
audit_log:
  retention_days: 30   # default: 30 days
```

| Value | Behavior |
|---|---|
| Omitted or `30` | Keep events for 30 days |
| `0` | Disable pruning (keep forever) |
| Negative | Config error — daemon refuses to start |

The daemon prunes expired records at startup and every 6 hours.
