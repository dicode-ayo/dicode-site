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

::: info How relay startup works
The relay connection is managed by an internal daemon task (`buildin/relay-server-body`). It is automatically **disabled** at registration unless **both** `relay.enabled: true` and `relay.server_url` are set — if either is missing, the task never starts and produces no log output. Once you add both values, the reconciler picks them up within ~30 seconds; no daemon restart is needed.
:::

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

### Identity rotation

The relay client is a Deno daemon task (`tasks/buildin/relay-client/`) that stores its identity encrypted at rest as `~/.dicode/relay-store/relay/identity-v1.bin` (or `$DICODE_DATADIR/relay-store/relay/identity-v1.bin` if you've overridden the data directory). To rotate the identity (generating a new UUID and relay URL):

1. Stop the daemon.
2. Delete `~/.dicode/relay-store/relay/identity-v1.bin` (or `$DICODE_DATADIR/relay-store/relay/identity-v1.bin` if you've overridden the data directory).
3. Restart the daemon — a fresh identity is generated automatically.

::: warning
Rotating the identity changes your relay URL. Update any external services (GitHub webhooks, Slack event subscriptions, etc.) that point to the old URL.
:::

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

::: tip Session-gated webhooks aren't reachable via the relay
`auth: true` webhooks are rejected outright when reached through the relay, rather than falling back to the usual `/login` redirect -- the relay only forwards `/hooks/*` and strips every credential header, so a session set via `/login` could never arrive anyway. Browsers get a `401` HTML explainer; API callers get `401` JSON. See [Relay behavior](./triggers.md#relay-behavior) in the triggers reference for details and a tunnel-based alternative for interactive remote access.
:::

### Size and timeout limits

- **Request body limit**: 5 MB maximum. Requests exceeding this are rejected with `413 Request Entity Too Large`.
- **Response timeout**: 25 seconds for the local daemon to respond (30 seconds on the server side). If the daemon does not respond in time, the relay returns `504 Gateway Timeout`.

---

## OAuth Broker (dicode.app Pro)

The hosted relay at `relay.dicode.app` includes an **OAuth broker** that eliminates the need to register your own OAuth apps with providers. This is a key feature of the dicode.app Pro plan.

The broker is the **single source of truth** for the providers it carries. As of `dicode-relay@0.1.5` that's 14 providers — `github`, `slack`, `google`, `spotify`, `linear`, `discord`, `gitlab`, `airtable`, `notion`, `confluence`, `salesforce`, `stripe`, `office365`, `azure` — and dicode-core no longer ships per-provider entries (`auth/github-oauth`, `auth/google-oauth`, …) for any of them. With `relay.enabled: true` you get the full broker flow with zero per-provider configuration in your taskset; the dashboard's `buildin/auth-providers` task discovers the catalogue dynamically from `GET /providers`.

For providers the broker doesn't carry (e.g. Looker) or for any provider you'd rather drive with your own OAuth app — see the [BYO flow](#byo-flow-providers-the-broker-doesn-t-carry) below.

::: info Migration note (2026-05)
Earlier dicode releases shipped per-provider entries `auth/github-oauth`, `auth/google-oauth`, `auth/slack-oauth`, etc. for every broker-backed provider. Those entries were removed once the broker became the source of truth — operators who relied on `/hooks/<provider>-oauth` callbacks for any of the 13 broker-backed providers should switch to the broker flow (no callback URL re-registration needed: the redirect URI lives on the broker, not your daemon). Operators who prefer to keep a self-hosted OAuth app for a specific provider can [instantiate `_oauth-app`](#byo-flow-providers-the-broker-doesn-t-carry) with their own credentials.
:::

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

1. `buildin/auth-start` fetches the daemon's cryptographic identity (via `dicode.crypto`), calls `buildAuthURL` from `npm:dicode-relay/client` to construct a signed `/auth/:provider?…&sig=…` URL, and tracks the session id in memory
2. The user opens that URL in a browser — the broker verifies the signature against the pubkey it knows for that UUID from the live WSS registry
3. Broker redirects to the provider's OAuth consent screen (using dicode's registered app)
4. User approves → provider redirects back to the broker with an authorization code
5. Broker exchanges the code for an access token
6. Token is **encrypted to the daemon's public key** (ECIES: P-256 ECDH + HKDF + AES-256-GCM, with the message type tag bound as GCM authenticated data)
7. Encrypted envelope is forwarded over the existing relay WebSocket to a reserved `/hooks/oauth-complete` path
8. `buildin/auth-relay` receives the envelope, calls `decryptTokenEnvelope` from `npm:dicode-relay/client` (which uses `dicode.crypto.decrypt` under the hood — **sub-keys derived via `secrets.LocalProvider.DeriveSubKey` never cross IPC**), and persists the resulting credentials as normal dicode secrets, encrypted at rest. `buildin/auth-relay` runs with `silent: true` and zero net/fs/env permissions, so plaintext token exfiltration is physically impossible.

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

### Discovering providers

The broker exposes its enabled providers at `GET /providers` (added in `dicode-relay@0.1.5`). The endpoint is unauthenticated and returns the metadata your daemon needs to render a "connect" UI without ever shipping a hard-coded catalogue. Secret values (`client_id`, `client_secret`) are never returned.

```sh
curl https://relay.dicode.app/providers
```

```json
[
  { "key": "github",   "pkce": true,  "scopes": ["user", "repo"],            "secret_required": true,  "configured": true },
  { "key": "slack",    "pkce": true,  "scopes": ["channels:read"],           "secret_required": false, "configured": true },
  { "key": "google",   "pkce": true,  "scopes": ["https://www.googleapis.com/auth/userinfo.email"], "secret_required": true, "configured": true },
  { "key": "notion",   "pkce": false, "scopes": [],                          "secret_required": true,  "configured": true },
  { "key": "stripe",   "pkce": false, "scopes": ["read_write"],              "secret_required": true,  "configured": true }
]
```

Field reference (matches `PublicProviderInfo` in `dicode-relay`):

| Field | Type | Meaning |
|-------|------|---------|
| `key` | string | Provider identifier — pass to `buildin/auth-start` as `provider=<key>` |
| `pkce` | bool | Whether the broker uses PKCE for this provider |
| `scopes` | string[] | Default scopes; tasks can override per request via `?scope=` |
| `secret_required` | bool | Whether the broker is configured with a `client_secret` for this provider |
| `configured` | bool | Whether `client_id` is set on this deployment (always `true` in the current implementation — providers without credentials are filtered out) |

A representative sample of providers the hosted broker at `relay.dicode.app` ships with — call `/providers` for the live, authoritative list:

| Provider | PKCE | Default scopes |
|----------|------|----------------|
| GitHub | Yes | `user repo` |
| Slack | Yes | `channels:read` |
| Google | Yes | `userinfo.email` |
| GitLab | Yes | `read_user read_api` |
| Discord | Yes | `identify email` |
| Notion | No | (empty) |
| Stripe | No | `read_write` |

Self-hosted brokers can add providers by editing `relay.yaml` and restarting — no code change to dicode-core, no daemon redeploy.

### BYO flow - providers the broker doesn't carry

For providers the relay broker doesn't proxy (Looker today), or for any provider you'd rather drive with your own OAuth app, dicode-core ships a generic OAuth task at `tasks/auth/_oauth-app/task.yaml`. You instantiate it from your own taskset with provider-specific overrides — the daemon talks to the provider directly, with credentials you store as secrets.

The default `auth` taskset ships `looker-oauth` as a working example, plus the standalone `openrouter-oauth`. To wire a new provider, copy one of those entries into your own taskset:

```yaml
# ~/dicode-tasks/taskset.yaml
apiVersion: dicode/v1
kind: TaskSet
metadata:
  name: my-tasks
spec:
  entries:
    my-google-oauth:
      ref:
        path: <path-to-dicode>/tasks/auth/_oauth-app/task.yaml
      overrides:
        name: My Google OAuth
        trigger: { webhook: /hooks/my-google-oauth }
        params:
          provider: google
          scope: "https://www.googleapis.com/auth/gmail.readonly"
          client_id_env: CLIENT_ID
          client_secret_env: CLIENT_SECRET
          access_token_env:  MY_GOOGLE_ACCESS_TOKEN
          refresh_token_env: MY_GOOGLE_REFRESH_TOKEN
        env:
          - { name: CLIENT_ID,               secret: MY_GOOGLE_CLIENT_ID }
          - { name: CLIENT_SECRET,           secret: MY_GOOGLE_CLIENT_SECRET }
          - { name: MY_GOOGLE_ACCESS_TOKEN,  secret: MY_GOOGLE_ACCESS_TOKEN,  optional: true }
          - { name: MY_GOOGLE_REFRESH_TOKEN, secret: MY_GOOGLE_REFRESH_TOKEN, optional: true }
```

Then store your credentials and click Connect on the dashboard:

```sh
dicode secret set MY_GOOGLE_CLIENT_ID     <client-id>
dicode secret set MY_GOOGLE_CLIENT_SECRET <client-secret>
```

The redirect URI registered with the provider must point at your daemon's webhook for this entry — typically `http://localhost:8080/hooks/my-google-oauth`, or `https://relay.dicode.app/u/<uuid>/hooks/my-google-oauth` if you're going through the relay. BYO works with or without `relay.enabled: true`; the broker is not in the loop for these flows.

The full walkthrough — including the `_oauth-app` parameter reference and a list of provider keys understood by `tasks/auth/_oauth/providers.ts` — lives in the [`tasks/auth/taskset.yaml`](https://github.com/dicode-ayo/dicode-core/blob/main/tasks/auth/taskset.yaml) header in dicode-core.

### Daemon-side connection status

The dashboard's **Auth providers** panel needs more than the catalogue — it has to show, for each provider, whether the user has already completed the OAuth flow. That join lives in a built-in daemon task, `buildin/auth-providers`, which combines the broker's `/providers` response with the daemon's local secrets store.

For each broker entry the task calls `dicode.secrets.has("<KEY>_ACCESS_TOKEN")` (a presence-only IPC verb — values never cross the boundary) and adds the result as `has_token`:

```json
[
  {
    "key": "github",
    "pkce": true,
    "scopes": ["user", "repo"],
    "secret_required": true,
    "configured": true,
    "has_token": true
  },
  {
    "key": "slack",
    "pkce": true,
    "scopes": ["channels:read"],
    "secret_required": false,
    "configured": true,
    "has_token": false
  }
]
```

Trigger it from the daemon via the standard task-run mechanism (the dashboard does this internally over IPC):

```sh
dicode run buildin/auth-providers action=list
```

The task accepts an optional `providers=key1,key2` parameter to filter the result, and an `action=connect` mode that delegates to `buildin/auth-start` to mint a signed `/auth/:provider` URL. Standalone (non-broker) providers like `openrouter` are appended to the list with their own `webhookPath` so the dashboard can route them past the broker.

Because the broker is the single source of truth, adding a new provider to `relay.yaml` is enough — the dashboard picks it up on the next refresh without a dicode-core release.

### Security

- **ECDSA-signed auth requests** — the broker verifies the caller controls the relay UUID before starting the OAuth flow. The signed payload layout is enforced by `buildAuthURL` in `npm:dicode-relay/client`, so task code can never coax the daemon identity key into signing a payload of the wrong shape (e.g. a WSS handshake digest).
- **PKCE binding** — the PKCE challenge is bound into the signed payload and cross-verified on delivery, preventing an attacker who intercepts the URL from swapping in their own challenge.
- **ECIES token encryption** — tokens are encrypted to the daemon's P-256 public key before entering the relay. Even a compromised relay server — or a CDN sitting in front of it — cannot read tokens.
- **Type-as-AAD domain separation** — the envelope's message-type tag is bound into AES-GCM's authenticated data on both ends. A ciphertext produced under any other type label (a future or malicious message type reusing the same ECIES scheme) will fail to decrypt through this path.
- **Pending-session validation** — the daemon tracks outstanding flows by session id and rejects deliveries whose session was never issued (or has expired). This closes a chosen-salt oracle against the identity key.
- **Reserved delivery path** — the trigger engine refuses to bind `/hooks/oauth-complete` to any task other than `buildin/auth-relay`, so an unrelated user task cannot become a drop-in exfiltration sink for decrypted credentials.
- **Plaintext never crosses IPC** — `buildin/auth-relay` runs with `silent: true` and zero net/fs/env permissions. Decryption (`dicode.crypto.decrypt`) and storage writes happen inside the task runtime; sub-keys derived via `secrets.LocalProvider.DeriveSubKey` are never surfaced outside the task boundary. Tokens live on as normal dicode secrets, encrypted at rest.
- **Metadata-only audit log** — every delivery emits a structured log entry with task id, run id, provider, session id, and the list of secret names written. No plaintext, no ciphertext, no pubkeys — just enough for incident response.
- **Single-use sessions** — broker sessions expire after 5 minutes and are deleted immediately after token delivery. Retries require a fresh flow.
- **No token storage on the broker** — the broker never persists tokens. They're encrypted and forwarded in one step.

### Self-hosted vs Pro

| | Self-hosted (free) | dicode.app Pro |
|---|---|---|
| Webhook relay | Yes (run your own server) | Yes (managed, unlimited) |
| OAuth broker | No — instantiate `_oauth-app` per provider with your own apps | Yes — 14 providers, zero setup |
| Custom domain | Your own domain | `*.dicode.app` |
| Token encryption | N/A | ECIES (P-256 + AES-256-GCM) |

---

## Self-hosted relay

You can run your own relay server instead of using the hosted `relay.dicode.app` service.

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
