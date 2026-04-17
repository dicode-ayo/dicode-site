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

---

## Provider chain

Secrets are resolved through a **provider chain**. When a secret is requested, dicode walks the chain in order -- the first provider that returns a non-empty value wins.

The default chain is:

1. **local** -- Encrypted SQLite store (see below)
2. **env** -- Host environment variables (fallback)

This means you can set secrets in either the encrypted store or as environment variables, with the encrypted store taking priority.

::: tip
Additional providers (HashiCorp Vault, AWS Secrets Manager, etc.) can be added by implementing the provider interface. The chain is extensible by design.
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

The built-in encrypted store is the default, but dicode's provider chain is designed to be extensible. The roadmap includes first-class integrations for:

| Provider | Status | How it will work |
|----------|--------|-----------------|
| **Built-in store** | Available now | ChaCha20-Poly1305 encrypted SQLite, Argon2id key derivation |
| **Environment variables** | Available now | Fallback when a secret isn't in the store — reads from `$ENV_VAR` |
| **Doppler** | Planned | Sync secrets from Doppler projects via their API |
| **1Password** | Planned | Resolve secrets from 1Password vaults via Connect or CLI |
| **HashiCorp Vault** | Planned | Read secrets from Vault KV v2 engine with token or AppRole auth |

The provider chain tries each provider in order. If the built-in store has the secret, it's used. If not, the next provider is tried. This means you can migrate incrementally — start with the local store, add Vault for production secrets later, and existing tasks don't change.

Configuration will look like:

```yaml
# dicode.yaml
secrets:
  providers:
    - type: local          # built-in encrypted store (always first)
    - type: env            # fallback to environment variables
    - type: vault          # HashiCorp Vault
      address: https://vault.mycompany.com
      auth: approle
      mount: secret/dicode
```

Tasks don't know or care which provider resolves their secrets — they just declare `secret: my_key` in `permissions.env` and the provider chain handles the rest.

## Security considerations

- Secrets are encrypted at rest using ChaCha20-Poly1305 with a unique nonce per value.
- The master key never leaves the machine (unless you set `DICODE_MASTER_KEY` explicitly).
- Task scripts can only access secrets that are explicitly declared in `permissions.env`.
- The `dicode` SDK's `secrets_set`/`secrets_delete` methods allow write access only -- no read-back.
- Secret values are never logged by dicode. Debug output masks all secret values.
