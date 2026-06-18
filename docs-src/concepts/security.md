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
| `offset` | Offset-based pagination (mutually exclusive with `after`) |
| `after` | Opaque cursor from a previous response's `next_cursor`; resumes from that position (mutually exclusive with `offset`) |
| `order` | `asc` or `desc` (default `desc` — newest-first) |

The response is a JSON object. Results are ordered newest-first by default (`order=desc`); pass `order=asc` to reverse.

**Response envelope:**

| Field | Description |
|---|---|
| `events` | Array of audit event objects (see per-event fields below) |
| `count` | Number of events in this page |
| `next_cursor` | Opaque cursor for the next page; absent when no further results exist. Pass as `after=` on the next request. |

::: tip Cursor vs offset
Use cursor pagination (`after=` + `next_cursor`) for forward-walking exports. Use `offset=` for random-access page access. Supplying both returns `400`.
:::

**Per-event fields** (each object in the `events` array):

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

### Exporting to Loki / Grafana

The built-in `buildin/audit-export-loki` task exports audit events to a [Grafana Loki](https://grafana.com/oss/loki/) endpoint. It runs on a cron schedule, tracks its position with a cursor in `dicode.kv`, and delivers events at-least-once — deduplicate downstream on the event `id` field.

#### Configuration

| Param / secret | How to supply | Description |
|---|---|---|
| `LOKI_ENDPOINT` | task param | Full Loki push URL, e.g. `https://logs.example.com/loki/api/v1/push` |
| `LOKI_AUTH_TOKEN` | `secret: loki_auth_token` | Bearer token (stored in dicode secrets) |

```bash
dicode secrets set loki_auth_token "Bearer glc_..."
```

Configure the endpoint via a taskset override in `dicode.yaml`:

```yaml
spec:
  entries:
    buildin:
      overrides:
        entries:
          audit-export-loki:
            params:
              LOKI_ENDPOINT: "https://logs.grafana.net/loki/api/v1/push"
```

#### Stream labels

Each log line is the full JSON audit event. Stream labels are low-cardinality:

| Label | Value |
|---|---|
| `job` | `dicode-audit` |
| `event_type` | `run_triggered`, `task_called`, `mcp_called`, or `denied` |

#### Adapting to other backends

The poll-batch-push structure (cursor in KV, fetch page, push, advance cursor only on success) is backend-agnostic. Copy `buildin/audit-export-loki` and change the HTTP target and serialization to target Datadog Logs, Elastic, or any other ingest API.
