# Webhook Relay

The webhook relay lets your local dicode instance receive webhooks from external services (GitHub, Slack, Stripe, etc.) without port forwarding, ngrok, or a public IP address.

## How it works

The relay is a persistent WebSocket tunnel between your local dicode daemon and a relay server:

```
External service                Relay server                  Your machine
(GitHub, Slack)            (relay.dicode.app)              (behind NAT/firewall)
      |                          |                              |
      |  POST /u/<uuid>/hooks/   |                              |
      |  ----------------------> |                              |
      |                          |  WS message (request)        |
      |                          |  --------------------------> |
      |                          |                              |  run task locally
      |                          |  WS message (response)       |
      |                          |  <-------------------------- |
      |  HTTP response           |                              |
      |  <---------------------- |                              |
```

1. The daemon connects **outbound** to the relay server over WebSocket (WSS). No inbound ports needed.
2. The relay server assigns a stable public URL based on the daemon's identity: `https://relay.dicode.app/u/<uuid>/hooks/`
3. External services send webhooks to this URL.
4. The relay server forwards the HTTP request as a WebSocket message to the daemon.
5. The daemon processes the request locally and sends the response back through the WebSocket.
6. The relay server returns the response to the original HTTP caller.

---

## Setup

Enable the relay in `dicode.yaml`:

```yaml
relay:
  enabled: true
  server_url: wss://relay.dicode.app
```

That is all. On next startup, the daemon connects to the relay and logs the assigned public URL.

---

## Identity

Each daemon has a stable cryptographic identity based on an ECDSA P-256 key pair.

- **Auto-generated**: The key pair is created automatically on first run and stored in `~/.dicode/`.
- **Stable UUID**: The relay UUID is derived from the public key: `hex(sha256(uncompressed_pubkey))`. This means the same machine always gets the same relay URL.
- **Challenge-response auth**: On each connection, the relay server sends a random challenge. The daemon signs it with its private key and sends the signature along with its public key. The server verifies the signature before accepting the connection.

The UUID is a 64-character hex string. Your relay URL will look like:

```
https://relay.dicode.app/u/a1b2c3d4e5f6.../hooks/
```

---

## What works through the relay

The relay forwards requests to these paths:

| Path pattern | Description |
|-------------|-------------|
| `/hooks/*` | All webhook endpoints (task webhooks) |
| `/dicode.js` | The client SDK for webhook task UIs |

Webhook task UIs (index.html, static assets) are served through the relay, so you can open your webhook task's URL in a browser from anywhere and interact with the UI.

::: tip
Use `https://relay.dicode.app/u/<uuid>/hooks/my-task` as the webhook URL when configuring GitHub, Slack, or any other external service.
:::

---

## Security

### Challenge-response authentication

The relay server authenticates every WebSocket connection using ECDSA P-256 challenge-response:

1. Server sends a 32-byte random nonce.
2. Client signs `sha256(nonce || timestamp_big_endian_uint64)` with its private key.
3. Server verifies the signature matches the claimed public key.
4. Server verifies `sha256(pubkey) == claimed_uuid`.
5. Server verifies the timestamp is within 30 seconds of current time.
6. Server verifies the nonce has not been used in the last 60 seconds (replay prevention).

If any check fails, the connection is rejected.

### Path whitelist

The relay client only forwards requests to `/hooks/*` and `/dicode.js`. All other paths are rejected with `403 Forbidden`. This limits the blast radius if the relay server is compromised -- the attacker cannot reach arbitrary daemon endpoints.

### X-Relay-Base header

When the relay client forwards a request to the local daemon, it sets the `X-Relay-Base` header to `/u/<uuid>`. This lets the daemon generate correct absolute URLs for resources served through the relay (e.g. links in webhook UI HTML pages). The relay client strips any incoming `X-Relay-Base` header from external requests to prevent spoofing.

### Hop-by-hop header filtering

The relay strips hop-by-hop headers (`Connection`, `Keep-Alive`, `Transfer-Encoding`, `Upgrade`, etc.) and sensitive headers (`Set-Cookie`) from responses before forwarding them to the external caller.

### Size and timeout limits

- **Request body limit**: 5 MB maximum. Requests exceeding this are rejected with `413 Request Entity Too Large`.
- **Response timeout**: 25 seconds for the local daemon to respond (30 seconds on the server side). If the daemon does not respond in time, the relay returns `504 Gateway Timeout`.

---

## OAuth Broker (dicode.app Pro)

The hosted relay at `relay.dicode.app` includes an **OAuth broker** that eliminates the need to register your own OAuth apps with providers. This is a key feature of the dicode.app Pro plan.

### How it works

::: info Prerequisite
The broker flow requires the relay to be enabled in your `dicode.yaml`:
```yaml
relay:
  enabled: true
  server_url: wss://relay.dicode.app
```
If the relay is not configured, `buildin/auth-start` will return an `oauth broker not configured on this daemon` error.
:::

Two built-in tasks ship with dicode and handle the full flow:

```sh
# 1. Ask the daemon to build a signed /auth/:provider URL
dicode run buildin/auth-start provider=slack

# Prints the URL — open it in your browser and approve. After consent,
# the broker delivers the encrypted token to your daemon automatically.

# 2. Once the flow completes, the token is in your secrets store:
dicode secrets list | grep SLACK
# → SLACK_ACCESS_TOKEN
# → SLACK_REFRESH_TOKEN      (if Slack returned one)
# → SLACK_EXPIRES_AT         (if expires_in was set)
# → SLACK_SCOPE
# → SLACK_TOKEN_TYPE
```

Under the hood:

1. `buildin/auth-start` calls `dicode.oauth.build_auth_url(provider, scope)` — the daemon signs a `/auth/:provider?…&sig=…` URL with its ECDSA identity key and tracks the session id in memory
2. The user opens that URL in a browser — the broker verifies the signature against the pubkey it knows for that UUID from the live WSS registry
3. Broker redirects to the provider's OAuth consent screen (using dicode's registered app)
4. User approves → provider redirects back to the broker with an authorization code
5. Broker exchanges the code for an access token
6. Token is **encrypted to the daemon's public key** (ECIES: P-256 ECDH + HKDF + AES-256-GCM, with the message type tag bound as GCM authenticated data)
7. Encrypted envelope is forwarded over the existing relay WebSocket to a reserved `/hooks/oauth-complete` path
8. `buildin/auth-relay` receives the envelope and calls the daemon's `store_token` IPC primitive, which decrypts, parses, and writes credentials to the secrets store — **all in Go-process memory**. The decrypted buffer is best-effort zeroed after the write (Go cannot guarantee memory erasure). Tokens then live on as normal dicode secrets, encrypted at rest via ChaCha20-Poly1305.

The token never appears in a browser URL and never touches the relay in plaintext. Tasks that declare the token as an `env` secret receive it in their process environment variables at runtime.

### Consuming the token

Once the flow completes, tokens are regular dicode secrets. Inject them into any task via the usual `env` declaration:

```yaml
# tasks/my-slack-bot/task.yaml
trigger:
  manual: true
permissions:
  env:
    - name: SLACK_TOKEN
      secret: SLACK_ACCESS_TOKEN
```

```ts
// tasks/my-slack-bot/task.ts
const token = Deno.env.get("SLACK_TOKEN")!;
const res = await fetch("https://slack.com/api/auth.test", {
  headers: { Authorization: `Bearer ${token}` },
});
```

### Supported providers

| Provider | PKCE | Scopes |
|----------|------|--------|
| GitHub | Yes | `user repo` |
| Slack | Yes | `channels:read` |
| Google | Yes | `userinfo.email` |
| Spotify | Yes | `user-read-private` |
| Linear | Yes | `read` |
| Discord | Yes | `identify email` |
| GitLab | Yes | `read_user read_api` |
| Airtable | Yes | `data.records:read` |
| Notion | No | — |
| Confluence | Yes | `read:me` |
| Salesforce | Yes | `api refresh_token` |
| Stripe | No | `read_write` |
| Office 365 | Yes | `User.Read Mail.Read` |
| Azure AD | Yes | `openid profile email` |

Tasks can override scopes per request. New providers can be added to the broker without any changes to your daemon or tasks.

### Security

- **ECDSA-signed auth requests** — the broker verifies the caller controls the relay UUID before starting the OAuth flow. The signed payload layout is hardcoded in Go, so task code can never coax the daemon identity key into signing a payload of the wrong shape (e.g. a WSS handshake digest).
- **PKCE binding** — the PKCE challenge is bound into the signed payload and cross-verified on delivery, preventing an attacker who intercepts the URL from swapping in their own challenge.
- **ECIES token encryption** — tokens are encrypted to the daemon's P-256 public key before entering the relay. Even a compromised relay server — or a CDN sitting in front of it — cannot read tokens.
- **Type-as-AAD domain separation** — the envelope's message-type tag is bound into AES-GCM's authenticated data on both ends. A ciphertext produced under any other type label (a future or malicious message type reusing the same ECIES scheme) will fail to decrypt through this path.
- **Pending-session validation** — the daemon tracks outstanding flows by session id and rejects deliveries whose session was never issued (or has expired). This closes a chosen-salt oracle against the identity key.
- **Reserved delivery path** — the trigger engine refuses to bind `/hooks/oauth-complete` to any task other than `buildin/auth-relay`, so an unrelated user task cannot become a drop-in exfiltration sink for decrypted credentials.
- **Plaintext never crosses JS** — decrypt, parse, and writes to the secrets store all happen in Go-process memory. `buildin/auth-relay` only ever sees the secret *names* that were written; the decrypted buffer is best-effort zeroed after `store_token` returns (Go cannot guarantee memory erasure). Tokens then live on as normal dicode secrets (encrypted at rest via ChaCha20-Poly1305).
- **Metadata-only audit log** — every delivery emits a structured log entry with task id, run id, provider, session id, and the list of secret names written. No plaintext, no ciphertext, no pubkeys — just enough for incident response.
- **Single-use sessions** — broker sessions expire after 5 minutes and are deleted immediately after token delivery. Retries require a fresh flow.
- **No token storage on the broker** — the broker never persists tokens. They're encrypted and forwarded in one step.

### Self-hosted vs Pro

| | Self-hosted (free) | dicode.app Pro |
|---|---|---|
| Webhook relay | Yes (run your own server) | Yes (managed, unlimited) |
| OAuth broker | No — register your own apps | Yes — 14 providers, zero setup |
| Custom domain | Your own domain | `*.dicode.app` |
| Token encryption | N/A | ECIES (P-256 + AES-256-GCM) |

---

## Self-hosted relay

You can run your own relay server instead of using the hosted `relay.dicode.app` service. Two implementations are available:

### Go relay server

The `relay.Server` type in the dicode-core repository implements the relay protocol as an `http.Handler`. Embed it in your own Go HTTP server:

```go
import "github.com/dicode/dicode/pkg/relay"

srv := relay.NewServer("https://relay.example.com", logger)
http.Handle("/", srv)
```

### Node.js relay server (dicode-relay)

The `dicode-relay` package is a standalone Node.js/TypeScript service that implements the relay protocol plus an optional OAuth broker for provider authentication. See the [dicode-relay repository](https://github.com/dicode-ayo/dicode-relay) for setup instructions.

### Configuration

Point your daemon at your self-hosted relay:

```yaml
relay:
  enabled: true
  server_url: wss://relay.example.com/ws
```

::: warning
Always use `wss://` (TLS) in production. The relay client accepts `ws://` for local development but logs a warning.
:::
