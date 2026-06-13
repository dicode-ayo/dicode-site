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

- **Exact-match keys** (case-insensitive): `authorization`, `cookie`, `password`, `passphrase`, `api_key`, `apikey`, `api-key`, `secret`, `token`, `bearer`, `credential`, `credentials`
- **Substring-match keys** (case-insensitive): any param name containing `key`, `token`, `secret`, `password`, `passphrase`, `credential`, or `signature` — for example, `signing_key`, `refresh_token`, `db_password`
- **Reference values**: any value that starts with `env:`, `secret:`, or `secrets:` (these reference daemon-resolved material)

When in doubt, redaction is the safe failure mode — `tokens_per_minute` would be redacted because its name contains `token`.

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

Results are returned newest-first as a JSON array. Each entry includes:

| Field | Description |
|---|---|
| `id` | Event UUID |
| `ts` | Timestamp (ISO 8601) |
| `event_type` | One of `run_triggered`, `task_called`, `mcp_called`, `denied` |
| `actor_kind` | Who initiated: `task`, `ip`, or trigger source (`cron`, `webhook`, …) |
| `actor_id` | Actor identifier (matches the `actor` query param) |
| `target_kind` | What was acted on: `task`, `mcp`, or `endpoint` |
| `target_id` | Target identifier — task ID, MCP tool name, or `METHOD /path` (matches the `task_id` query param) |
| `params` | Sanitized JSON of call parameters (`[REDACTED]` for sensitive values) |
| `run_id` | Associated run ID, when applicable |
| `allowed` | `true` if the operation was allowed; `false` if denied |
| `reason` | Denial reason or context note |

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
