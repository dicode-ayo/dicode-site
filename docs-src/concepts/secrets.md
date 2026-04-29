# Secrets

dicode provides a built-in encrypted secrets store for managing sensitive values like API keys, tokens, and passwords. Secrets are injected into task runtimes as environment variables -- tasks never read secrets directly from the store.

## Declaring secrets in task.yaml

Tasks access secrets through the `permissions.env` block. The `secret:` field tells dicode to resolve the value from the secrets store:

```yaml
permissions:
  env:
    - name: GITHUB_TOKEN
      secret: github_token        # key in the secrets store
    - name: DB_PASSWORD
      secret: db_password
      optional: true              # empty string if not found (instead of failing)
```

When the task runs, dicode resolves `github_token` from the secrets store and injects it as the `GITHUB_TOKEN` environment variable.

### All env entry forms

The `permissions.env` block supports four forms:

```yaml
permissions:
  env:
    # Bare name: allowlist a host env var (task reads it at runtime)
    - HOME

    # Rename from host env: read $GH_TOKEN, inject as API_KEY
    - name: API_KEY
      from: GH_TOKEN

    # Secret injection: resolve from secrets store, inject as DB_PASS
    - name: DB_PASS
      secret: db_password

    # Literal value: inject a fixed string (used by TaskSet overrides)
    - name: LOG_LEVEL
      value: info
```

### Running a prereq task when a secret is missing

Secret-backed entries accept an `if_missing:` directive that names a task to run *before* the main task dispatches when the secret isn't present in the store. This is the hook that turns a first-time OAuth flow into zero-paste onboarding: the user triggers the real task, the engine notices the key is absent, fires the OAuth task in chain mode, and only runs the real task once the key is stored.

```yaml
permissions:
  env:
    - name: OPENROUTER_API_KEY
      secret: OPENROUTER_API_KEY
      if_missing:
        task: auth/openrouter-oauth
        # params: { ... }    # optional, forwarded to the prereq task
```

Behavior:

- Secret present → `if_missing` is a no-op; task runs immediately.
- Secret missing → engine synchronously fires the named task in chain mode. If it succeeds and the secret is now resolvable, the main task runs. If it fails — for example an OAuth flow throwing *"Open this URL to authorize: …"* — that error becomes the main task's failure, giving the UI a clickable setup link to show the user.

Only `secret:`-backed entries honor `if_missing:`. On `from:`, `value:`, or bare entries the directive is silently ignored — there's no secret to check for in the first place.

---

## Provider chain

Secrets are resolved through a **provider chain**. When a secret is requested, dicode walks the chain in order -- the first provider that returns a non-empty value wins.

The default chain is:

1. **local** -- Encrypted SQLite store (see below)
2. **env** -- Host environment variables (fallback)

This means you can set secrets in either the encrypted store or as environment variables, with the encrypted store taking priority.

::: tip
External secret stores (Doppler, 1Password, HashiCorp Vault, …) are resolved via **provider tasks** rather than native adapters — see ["Provider tasks (`from: task:`)"](#provider-tasks-from-task) below. The resolver groups requests per provider, caches per the provider's declared TTL, and merges the result into the consumer's environment.
:::

---

## Local encrypted store

The default secrets provider stores values in an encrypted SQLite database.

### Encryption

- **Algorithm**: ChaCha20-Poly1305 (XChaCha variant with extended nonce)
- **Key derivation**: Argon2id (1 iteration, 64 MB memory, 4 threads) from a 32-byte master key
- **Per-value nonce**: Each secret is encrypted with a unique random nonce

### Master key

The encryption key is derived from a master key, resolved in this order:

1. `DICODE_MASTER_KEY` environment variable (base64-encoded 32 bytes)
2. `~/.dicode/master.key` file (auto-generated on first run, chmod 600)

On first run, if no master key exists, dicode generates a random 32-byte key and saves it to `~/.dicode/master.key` with `0600` permissions. A random salt is also generated and stored at `~/.dicode/master.salt`.

::: warning
Back up `~/.dicode/master.key` and `~/.dicode/master.salt` if you have secrets you cannot recreate. Without the master key, encrypted secrets cannot be recovered.
:::

---

## Managing secrets via CLI

The `dicode` CLI provides three commands for managing secrets:

### Set a secret

```bash
dicode secrets set github_token ghp_abc123def456
dicode secrets set db_password "my-complex-password"
```

### List secret keys

```bash
dicode secrets list
```

This lists only the key names -- secret values are never displayed.

### Delete a secret

```bash
dicode secrets delete old_api_key
```

::: warning
There is no `dicode secrets get` command. This is intentional -- secrets are write-only from the CLI and can only be consumed by tasks through environment variable injection.
:::

---

## Programmatic secret management

Deno tasks with `permissions.dicode.secrets_write: true` can set and delete secrets at runtime:

```ts
export default async function main({ dicode }: DicodeSdk) {
  // Store a secret (e.g. from an OAuth token exchange)
  await dicode.secrets_set("OAUTH_TOKEN", accessToken);

  // Remove an expired secret
  await dicode.secrets_delete("OLD_TOKEN");
}
```

```yaml
# task.yaml
permissions:
  dicode:
    secrets_write: true
```

Tasks can write or overwrite secrets but never read them back via the SDK. Secret values are only available through environment variable injection.

---

## Environment variable fallback

If a secret key is not found in the encrypted store, the provider chain falls back to host environment variables. This is useful for:

- **CI/CD**: Inject secrets as environment variables in your CI pipeline without setting up the encrypted store.
- **Development**: Use `.env` files or shell exports during local development.
- **Migration**: Gradually move from env vars to the encrypted store.

```yaml
permissions:
  env:
    - name: API_KEY
      secret: api_key     # first checks encrypted store, then falls back to $api_key env var
```

---

## External secret providers

The built-in encrypted store is the default, but dicode resolves secrets from external services through a **task-based provider mechanism** — no daemon release is required to add a new provider. Ship a task folder, reference it from `from: task:<id>`, and you're done.

| Provider | Status | Notes |
|---|---|---|
| Built-in encrypted store | Available | ChaCha20-Poly1305, Argon2id |
| Host environment variables | Available | Fallback in the chain |
| Doppler | Available | Buildin task `buildin/secret-providers/doppler`. Bootstrap with `DOPPLER_TOKEN`. |
| 1Password | Available via custom provider task | Author your own using the `from: task:` mechanism — see "Provider tasks" below. |
| HashiCorp Vault | Available via custom provider task | Same as above. |

Tasks don't know or care which provider resolves their secrets — they declare `from: task:<id>` (or `secret: <name>`) in `permissions.env` and the resolver handles the rest. You can migrate incrementally: start with the local store, add a Doppler provider task in production, and existing tasks don't change.

---

## Provider tasks (`from: task:`)

For Doppler, 1Password, HashiCorp Vault, and other external secret stores, dicode resolves secrets by spawning a normal task that calls the upstream API. Provider tasks are first-class tasks — they run in the same sandbox, declare their own `permissions`, ship in your sources, and can be authored by anyone.

### Consumer side — `from: task:<provider-id>`

Reference a provider task from any consumer's `permissions.env` block:

```yaml
# tasks/my-app/task.yaml
name: "My App"
runtime: deno
trigger:
  cron: "*/5 * * * *"
permissions:
  env:
    - name: PG_URL
      from: task:secret-providers/doppler   # resolved via the doppler provider task
    - name: REDIS_URL
      from: task:secret-providers/doppler   # batched: one spawn for both
      optional: true
    - name: LOG_LEVEL
      from: env:LOG_LEVEL                   # explicit host env
```

The daemon groups every `from: task:<id>` entry by provider, spawns each provider once per consumer launch, caches the result with the provider's declared TTL, and merges the resolved values into the consumer's process environment before launching it.

### Provider side — `dicode.output(map, { secret: true })`

A provider is any task that emits its resolved secrets via the secret-flag overload of `output`:

```yaml
# tasks/buildin/secret-providers/doppler/task.yaml
name: "Doppler Secret Provider"
runtime: deno
trigger:
  manual: true
permissions:
  env:
    - name: DOPPLER_TOKEN
      secret: DOPPLER_TOKEN     # bootstrap once via `dicode secrets set DOPPLER_TOKEN ...`
  net:
    - api.doppler.com
provider:
  cache_ttl: 5m                  # 0 / omitted = no caching
```

```typescript
// task.ts
export default async function main({ params, output }: DicodeSdk) {
  const reqs = JSON.parse(await params.get("requests") ?? "[]");
  const out: Record<string, string> = {};
  // ... call upstream, populate `out` ...
  await output(out, { secret: true });
}
```

Daemon-side semantics for `secret: true`:

- Run-log records keys with `[redacted]` placeholders only — values never hit disk.
- Values feed the run-log redactor on the consumer launch (so a `console.log` of a resolved value is scrubbed).
- The map is returned to the resolver awaiting this provider call.
- Output must be a flat `Record<string, string>` — the daemon refuses nested objects.

### Failure modes

When a provider task fails or returns an unusable result, the consumer run is failed with a typed reason recorded on the run record. All three trigger the configured `on_failure_chain`. The provider's own run also fires its own chain on its own crash.

| Reason | When it fires |
|---|---|
| `provider_unavailable: <id>` | Provider task crashed, timed out, or returned no map. |
| `required_secret_missing: <KEY> from <id>` | Provider returned a map but a non-optional KEY was absent. |
| `provider_misconfigured: <id>` | Task referenced via `task:<id>` is not a provider (missing `secret: true` flag on its `output`). |

### Built-in providers

| Path | Upstream | Bootstrap secret |
|---|---|---|
| `buildin/secret-providers/doppler` | Doppler REST API | `DOPPLER_TOKEN` |

More providers ship under the same path over time (`buildin/secret-providers/onepassword`, `vault`, …). Authoring your own takes a `task.yaml` + `task.ts` pair — see [tasks](./tasks.md).

### Authoring guidance: SDK vs raw `fetch`

Provider tasks are credential-handling code. Pick the smaller dependency surface that gets the job done.

**Use raw `fetch` when:**

- The upstream API is small (one or two endpoints) and stable.
- The auth scheme is a static header (Bearer token, X-API-Key).
- An SDK exists but is autogenerated / unmaintained / heavyweight.
- The buildin doppler provider is the canonical example: ~70 LOC, zero deps beyond Deno's stdlib.

**Reach for an SDK when:**

- The upstream surface is non-trivial (vault selection, item navigation, pagination, multi-step auth flows).
- The auth method is dynamic (AppRole login → token → renew, OAuth device-flow, AWS IAM signing).
- The SDK is officially maintained and pinned to a specific upstream contract.
- 1Password Connect (`@1password/connect`) and HashiCorp Vault (`node-vault`) are the typical cases.

**For Deno tasks specifically:** prefer JSR or `https://deno.land/x/` imports over `npm:` specifiers when both exist — JSR/x packages are typically smaller, audit-friendlier, and don't drag in Node compat shims.

**Always:** pin SDK versions (no floating tags). The provider task content hash invalidates the resolver's cache when source changes — a silently-updated SDK is invisible to that signal.

## Security considerations

- Secrets are encrypted at rest using ChaCha20-Poly1305 with a unique nonce per value.
- The master key never leaves the machine (unless you set `DICODE_MASTER_KEY` explicitly).
- Task scripts can only access secrets that are explicitly declared in `permissions.env`.
- The `dicode` SDK's `secrets_set`/`secrets_delete` methods allow write access only -- no read-back.
- Secret values are never logged by dicode. Debug output masks all secret values.
