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
