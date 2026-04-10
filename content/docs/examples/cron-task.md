# Example: Cron Task

This example builds a **GitHub PR Digest** task that runs every weekday at 9 AM,
fetches open pull requests for a repository, posts a summary to Slack, and
tracks changes between runs using the key-value store.

## Directory structure

```
tasks/pr-digest/
  task.yaml
  task.ts
```

## task.yaml

```yaml
apiVersion: dicode/v1
kind: Task
name: PR Digest
description: |
  Posts a daily summary of open PRs to Slack.
  Runs weekdays at 09:00 and tracks PR count changes between runs.
runtime: deno

trigger:
  cron: "0 9 * * 1-5"   # weekdays at 09:00

params:
  repo:
    description: GitHub repo in owner/name format
    default: "myorg/myapp"
  slack_channel:
    description: Slack channel name (for display only)
    default: "#engineering"

permissions:
  env:
    - GITHUB_TOKEN
    - SLACK_WEBHOOK_URL
  net:
    - "api.github.com"
    - "hooks.slack.com"

timeout: 30s
```

Key points in the YAML:

- **`trigger.cron`** uses standard cron syntax. `0 9 * * 1-5` fires at 9 AM
  Monday through Friday.
- **`params`** declares task parameters with defaults. The task script reads
  them with `await params.get("repo")`.
- **`permissions.env`** lists the environment variables the Deno sandbox is
  allowed to read. dicode passes these to `--allow-env`.
- **`permissions.net`** restricts outbound network access to specific hosts.

## task.ts

```ts
import type { DicodeSdk } from "../../sdk.ts";

export default async function main({ params, kv, output }: DicodeSdk) {
  const repo = await params.get("repo");
  const slackChannel = await params.get("slack_channel");

  if (!repo) throw new Error("repo param is required");

  const githubToken = Deno.env.get("GITHUB_TOKEN");
  const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");

  if (!githubToken) throw new Error("GITHUB_TOKEN not set");
  if (!slackWebhookUrl) throw new Error("SLACK_WEBHOOK_URL not set");

  // ── Fetch open PRs from GitHub ────────────────────────────────────
  console.log(`Fetching open PRs for ${repo}...`);

  const res = await fetch(
    `https://api.github.com/repos/${repo}/pulls?state=open&per_page=100`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubToken}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const pulls = (await res.json()) as Array<{
    number: number;
    title: string;
    user: { login: string };
    html_url: string;
    created_at: string;
    draft: boolean;
  }>;

  const prCount = pulls.length;
  console.log(`Found ${prCount} open PR(s)`);

  // ── Compare with previous run ─────────────────────────────────────
  const kvKey = `pr-digest:${repo}:count`;
  const prev = (await kv.get(kvKey)) as number | null;
  await kv.set(kvKey, prCount);

  const delta = prev !== null ? prCount - prev : null;
  const trend =
    delta === null
      ? "first run"
      : delta > 0
        ? `+${delta} since yesterday`
        : delta < 0
          ? `${delta} since yesterday`
          : "no change";

  console.log(`Trend: ${trend}`);

  // ── Post to Slack ─────────────────────────────────────────────────
  const prLines = pulls
    .slice(0, 15)
    .map((pr) => `- <${pr.html_url}|#${pr.number}> ${pr.title} (${pr.user.login})${pr.draft ? " [draft]" : ""}`)
    .join("\n");

  const slackPayload = {
    text: `*PR Digest for ${repo}*  (${prCount} open, ${trend})\n${prLines}`,
  };

  const slackRes = await fetch(slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slackPayload),
  });

  if (!slackRes.ok) {
    throw new Error(`Slack webhook error: ${slackRes.status}`);
  }

  console.log(`Posted digest to ${slackChannel}`);

  return { prCount, changed: delta !== 0 };
}
```

## Key patterns

This task demonstrates several core dicode features:

| Pattern | How it is used |
| --- | --- |
| **Cron trigger** | `trigger.cron` in task.yaml schedules automatic runs |
| **Parameters** | `await params.get("repo")` reads declared params with defaults |
| **Environment variables** | `Deno.env.get("GITHUB_TOKEN")` reads secrets allowed by `permissions.env` |
| **Native fetch** | No HTTP library needed -- Deno's built-in `fetch()` calls GitHub and Slack |
| **Key-value store** | `await kv.get()` / `await kv.set()` persists the PR count across runs |
| **Console logging** | `console.log()` streams to the dicode run log in real time |
| **Structured return** | `return { prCount, changed }` is stored as the run result, visible in the UI and accessible via `dicode.get_runs()` |

### Setting up secrets

Before running this task, store the required tokens:

```bash
dicode secret set GITHUB_TOKEN ghp_xxxxxxxxxxxx
dicode secret set SLACK_WEBHOOK_URL https://hooks.slack.com/services/T.../B.../xxx
```

dicode injects secrets as environment variables at runtime. The `permissions.env`
list in task.yaml controls which variables the Deno sandbox can access.

### Testing manually

You can trigger the task outside its cron schedule:

```bash
dicode run pr-digest
dicode run pr-digest --param repo=denoland/deno
```
