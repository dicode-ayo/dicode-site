# Throwaway UIs

Daemon tasks can serve HTTP, turning any task into a lightweight web frontend. No framework, no build step, no deployment pipeline — just a task that serves HTML.

## When to use this

- Debug webhook payloads with a live-updating page
- Collect team input with a quick poll or form
- Build an approval gate with Accept/Reject buttons
- Create a status dashboard from task run results
- Run simulations with a parameter form

## Webhook visualizer

A daemon task that receives webhooks and displays them in real time:

::: code-group

```yaml [task.yaml]
apiVersion: dicode/v1
kind: Task
name: webhook-viewer
runtime: deno
trigger:
  daemon: true
  restart: always
```

```typescript [task.ts]
const events: unknown[] = [];

Deno.serve({ port: 3001 }, async (req) => {
  if (req.method === "POST") {
    events.push({
      time: new Date().toISOString(),
      body: await req.json(),
    });
    return new Response("ok");
  }

  return new Response(`
    <!DOCTYPE html>
    <html>
    <body style="font-family: system-ui; max-width: 800px; margin: 2rem auto;">
      <h1>Webhook Events (${events.length})</h1>
      <pre>${JSON.stringify(events.slice(-20), null, 2)}</pre>
      <script>setTimeout(() => location.reload(), 2000)</script>
    </body>
    </html>
  `, { headers: { "content-type": "text/html" } });
});
```

:::

Point your webhook relay URL at this task and watch payloads arrive in real time.

## Team poll

A quick poll backed by the built-in KV store:

::: code-group

```yaml [task.yaml]
apiVersion: dicode/v1
kind: Task
name: team-poll
runtime: deno
trigger:
  daemon: true
  restart: always
```

```typescript [task.ts]
Deno.serve({ port: 3002 }, async (req) => {
  if (req.method === "POST") {
    const form = await req.formData();
    const choice = form.get("choice") as string;
    await kv.set(`vote:${Date.now()}`, choice);
    return Response.redirect("/");
  }

  const votes = await kv.list("vote:");
  const counts: Record<string, number> = {};
  for (const v of votes) {
    counts[v.value as string] = (counts[v.value as string] ?? 0) + 1;
  }

  return new Response(`
    <!DOCTYPE html>
    <html>
    <body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; text-align: center;">
      <h2>Friday lunch?</h2>
      <form method="POST" style="display: flex; gap: 1rem; justify-content: center;">
        <button name="choice" value="pizza" style="font-size: 2rem; padding: 1rem 2rem; cursor: pointer;">
          Pizza (${counts["pizza"] ?? 0})
        </button>
        <button name="choice" value="sushi" style="font-size: 2rem; padding: 1rem 2rem; cursor: pointer;">
          Sushi (${counts["sushi"] ?? 0})
        </button>
      </form>
      <p style="color: #666; margin-top: 1rem;">${votes.length} votes total</p>
    </body>
    </html>
  `, { headers: { "content-type": "text/html" } });
});
```

:::

## Approval gate

A human-in-the-loop task that pauses execution until someone clicks Approve or Reject:

```typescript
// approval-gate/task.ts
Deno.serve({ port: 3003 }, async (req) => {
  if (req.method === "POST") {
    const form = await req.formData();
    const decision = form.get("decision") as string;
    await kv.set("approval", decision);
    // Trigger the downstream task
    if (decision === "approve") {
      await dicode.run_task("deploy-production");
    }
    return new Response(`<h2>${decision === "approve" ? "Approved" : "Rejected"}</h2>`, {
      headers: { "content-type": "text/html" },
    });
  }

  return new Response(`
    <h2>Deploy to production?</h2>
    <form method="POST" style="display: flex; gap: 1rem;">
      <button name="decision" value="approve" style="background: #22c55e; color: white; padding: .8rem 2rem; border: none; border-radius: 8px; cursor: pointer;">Approve</button>
      <button name="decision" value="reject" style="background: #ef4444; color: white; padding: .8rem 2rem; border: none; border-radius: 8px; cursor: pointer;">Reject</button>
    </form>
  `, { headers: { "content-type": "text/html" } });
});
```

## Key points

- Throwaway UIs are **just daemon tasks** — they get git versioning, permissions, secrets, KV store, and run history for free
- Delete the task folder and the UI is gone — no cleanup needed
- Combine with the webhook relay for public-facing forms behind NAT
- Use `dicode.run_task()` to trigger other tasks from button clicks
