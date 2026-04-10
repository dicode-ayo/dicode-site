# Example: Webhook with HTML UI

This example builds a **Feedback Form** task that serves an HTML form at its
webhook URL. Users submit feedback through the browser, the task stores it in
the key-value store, and responds with a rich HTML confirmation.

## Directory structure

```
tasks/feedback-form/
  task.yaml
  task.ts
  index.html
  style.css
```

## task.yaml

```yaml
apiVersion: dicode/v1
kind: Task
name: Feedback Form
description: |
  Collects user feedback via an HTML form served at the webhook URL.
  Submissions are stored in kv and acknowledged with an HTML response.
runtime: deno

trigger:
  webhook: /hooks/feedback
  webhook_secret: "${FEEDBACK_SECRET}"

params:
  message:
    type: string
    description: The feedback message (submitted from the form)
    required: true
  name:
    type: string
    description: Submitter name (optional)
    default: "Anonymous"

timeout: 10s
```

Setting `webhook_secret` enables HMAC-SHA256 verification. When the `data-dicode`
form submits, the injected SDK handles signing automatically. For external
callers, dicode validates the `X-Hub-Signature-256` header before the script runs.

## index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback</title>
  <link rel="stylesheet" href="style.css">
  <!--
    dicode.js is automatically injected by dicode when serving this page.
    It provides window.dicode with run(), execute(), stream(), and result()
    methods, and auto-enhances any <form data-dicode> element.
  -->
</head>
<body>
<div class="card">
  <h1>Send Feedback</h1>
  <p class="subtitle">Your feedback is processed by a local dicode task.</p>

  <!--
    data-dicode: dicode.js intercepts the form submit, POSTs JSON to
    the webhook, streams task logs into #output, and renders the
    output.html() result when the task finishes.

    data-output: CSS selector for the element that receives streamed
    logs and the final HTML output.
  -->
  <form data-dicode data-output="#output">
    <label for="name">Your name</label>
    <input type="text" id="name" name="name" placeholder="Optional">

    <label for="message">Message</label>
    <textarea id="message" name="message" placeholder="What's on your mind?"
              required></textarea>

    <button type="submit">Send Feedback</button>
  </form>

  <div id="output"></div>
</div>
</body>
</html>
```

The `data-dicode` attribute is the key integration point. When dicode serves
this page, it injects a small `dicode.js` script that:

1. Intercepts form submission (no page reload).
2. Serializes form fields as JSON and POSTs to the webhook URL.
3. Streams task logs into the `data-output` target in real time.
4. Renders the `output.html()` result when the task completes.

You do not need to include `dicode.js` yourself -- it is injected automatically.

## style.css

```css
* { box-sizing: border-box; margin: 0; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

h1 { margin-bottom: 0.25rem; }
.subtitle { color: #666; margin-bottom: 1.5rem; font-size: 0.9rem; }

label {
  display: block;
  font-weight: 600;
  margin: 1rem 0 0.25rem;
  font-size: 0.875rem;
}

input, textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

textarea { min-height: 100px; resize: vertical; }

button {
  margin-top: 1.25rem;
  width: 100%;
  padding: 0.6rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
}

button:hover { background: #1d4ed8; }

#output {
  margin-top: 1.5rem;
  font-size: 0.85rem;
  white-space: pre-wrap;
  color: #555;
}
```

## task.ts

```ts
import type { DicodeSdk } from "../../sdk.ts";

export default async function main({ input, params, kv, output }: DicodeSdk) {
  const message = String(await params.get("message") ?? "");
  const name = String(await params.get("name") ?? "Anonymous");

  if (!message) throw new Error("message is required");

  console.log(`Feedback received from ${name}`);

  // Store feedback with a timestamp key
  const ts = new Date().toISOString();
  const key = `feedback:${ts}`;

  await kv.set(key, {
    name,
    message,
    timestamp: ts,
  });

  console.log(`Stored as ${key}`);

  // Count total feedback entries
  const all = await kv.list("feedback:");
  const total = Object.keys(all).length;

  console.log(`Total feedback entries: ${total}`);

  return output.html(`
<div style="font-family:system-ui,sans-serif;max-width:480px;padding:1.5rem">
  <h2 style="margin:0 0 0.5rem;color:#16a34a">Thank you!</h2>
  <p style="color:#555;margin:0 0 1rem">
    Your feedback has been recorded.
  </p>
  <div style="background:#f8f9fa;padding:1rem;border-radius:8px;font-size:0.9rem">
    <p style="margin:0 0 0.5rem"><strong>${name}</strong></p>
    <p style="margin:0;color:#333">${message}</p>
    <p style="margin:0.75rem 0 0;color:#888;font-size:0.8rem">${ts}</p>
  </div>
  <p style="margin:1rem 0 0;color:#888;font-size:0.8rem">
    Entry #${total} &middot;
    <a href="/hooks/feedback" style="color:#2563eb">Submit another</a>
  </p>
</div>
`);
}
```

## How it works

The webhook-with-UI pattern follows a four-step flow:

1. **GET request** -- A user opens the webhook URL (`/hooks/feedback`) in a
   browser. dicode detects the `index.html` file in the task directory and
   serves it, injecting `dicode.js` automatically.

2. **Form submission** -- The user fills in the form and clicks submit. The
   `data-dicode` attribute causes `dicode.js` to intercept the submit event,
   serialize the form fields as JSON, and POST them to the webhook URL.

3. **Task execution** -- dicode receives the POST, validates the webhook
   secret (if configured), maps JSON fields to task params, and runs
   `task.ts`. Console output streams to the `#output` element in real time.

4. **Result rendering** -- When the task completes, `output.html()` sends
   rich HTML back to the browser. `dicode.js` renders it in the `#output`
   element, replacing the streamed logs.

### Without dicode.js

If you remove `data-dicode` and add `method="POST"` and `action="/hooks/feedback"`
to the form, it works as a plain HTML form. dicode will execute the task and
redirect to the run result page. The `dicode.js` enhancement is optional --
it adds real-time streaming and in-page rendering without a full page reload.

### Testing with curl

```bash
BODY='{"message":"Great tool!","name":"Alice"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print "sha256="$2}')

curl -X POST http://localhost:8080/hooks/feedback \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: $SIG" \
  -d "$BODY"
```
