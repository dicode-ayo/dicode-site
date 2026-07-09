# Example: Suspend Wizard

This example walks through the **Suspend Wizard**, a manually-triggered task shipped in dicode-core at [`tasks/examples/suspend-wizard/`](https://github.com/dicode-ayo/dicode-core/tree/main/tasks/examples/suspend-wizard). It's a three-step "new project" wizard -- project name → framework → confirm -- built entirely on [`dicode.suspend()`](/concepts/sdk#dicode-suspend) and the `steps`-map auto-dispatch, with every form rendered straight from a JSON Schema. Copy this directory as the starting point for your own human-in-the-loop wizard.

See [Suspend & Resume](/concepts/suspend-resume) for the full concept -- this page focuses on how the shipped example is put together.

## Directory structure

```
tasks/examples/suspend-wizard/
  task.yaml
  task.ts
  task.test.ts
```

## task.yaml

```yaml
apiVersion: dicode/v1
kind: Task
name: Suspend Wizard (example)
description: |
  A multi-step "new project" wizard that demonstrates suspendable tasks. Trigger
  it manually from the web UI: the run pauses and renders an auto-generated form
  at each step (project name → framework → confirm), then finishes with a summary.
  Shows the steps-map + JSON-Schema resume flow with no hand-rolled step switch.
runtime: deno

trigger:
  manual: true

timeout: 30s
```

Nothing in `permissions` grants `dicode.suspend()` -- it's available by default on the `deno` and `python` runtimes. See [Suspend & Resume -- Runtime scope](/concepts/suspend-resume#runtime-scope).

## task.ts

```ts
import type { DicodeSdk } from "../../sdk.ts";

export default async function main({ dicode }: DicodeSdk) {
  await dicode.suspend({
    to: "chooseFramework",
    schema: {
      type: "object",
      title: "New project",
      description: "Let's scaffold a project. What should we call it?",
      properties: {
        project_name: { type: "string", title: "Project name" },
      },
      required: ["project_name"],
    },
  });
  // Unreachable -- suspend() never returns.
}

export const steps = {
  // The project name arrives on ctx.input; ask for a framework and carry the
  // name forward in state so the confirm step can echo it back.
  async chooseFramework({ dicode, input }: DicodeSdk) {
    const project = (input as { project_name: string }).project_name;
    await dicode.suspend({
      to: "confirm",
      state: { project },
      schema: {
        type: "object",
        title: `Framework for ${project}`,
        properties: {
          framework: {
            type: "string",
            title: "Framework",
            enum: ["deno", "node", "bun"],
          },
        },
        required: ["framework"],
      },
    });
  },

  // Both prior answers are in hand (name in state, framework in input); ask
  // for a final confirmation, carrying name + framework forward.
  async confirm({ dicode, input, state }: DicodeSdk) {
    const project = (state as { project: string }).project;
    const framework = (input as { framework: string }).framework;
    await dicode.suspend({
      to: "summarize",
      state: { project, framework },
      schema: {
        type: "object",
        title: "Confirm",
        description: `Create ${project} (${framework})?`,
        properties: {
          confirmed: { type: "boolean", title: "Create the project?" },
        },
        required: ["confirmed"],
      },
    });
  },

  // Terminal step: return the collected summary.
  summarize({ input, state }: DicodeSdk) {
    const { project, framework } = state as { project: string; framework: string };
    const confirmed = (input as { confirmed: boolean }).confirmed;
    return { project, framework, confirmed };
  },
};
```

## How it works

1. **Run it.** In the web UI, open **Suspend Wizard (example)** and click **Run**. The run goes `suspended` immediately, and its detail page renders a form generated from `main`'s schema (one required text field, `project_name`).
2. **Step 1 -- project name.** Submitting the form resumes the run. Because `main` suspended with `to: "chooseFramework"`, the runner dispatches `steps.chooseFramework` with the submission on `ctx.input`. It reads `project_name`, carries it forward as `state: { project }`, and suspends again with `to: "confirm"` -- this time asking for a `framework`.
3. **Step 2 -- framework.** The rendered form now shows a `framework` **select** (the JSON Schema `enum` renders as a dropdown, not free text). Submitting resumes into `steps.confirm`, which reads the framework from `ctx.input` and the project name from `ctx.state`, then suspends a third time with `to: "summarize"` and a `confirmed` **boolean** (rendered as a checkbox).
4. **Step 3 -- confirm and finish.** Submitting the checkbox resumes into `steps.summarize`, the terminal step. It has both `project` and `framework` in `ctx.state` and `confirmed` in `ctx.input`, and returns `{ project, framework, confirmed }`. The run ends `resumed`, and the returned object is visible on the run's detail page.

At no point does `task.ts` branch on `if (state)` -- the runner picks the right `steps` entry from the `to` name recorded on each `suspend()` call, so each step is a small, self-contained handler.

### From the CLI

The same flow works without the web UI:

```console
$ dicode run examples/suspend-wizard
$ dicode resume
RUN ID   TASK                      SUSPENDED AT          FIELDS
a1b2...  examples/suspend-wizard   2026-07-09T10:00:00Z  project_name

$ dicode resume a1b2... project_name=acme
resumed: continuation run c3d4...

$ dicode resume
RUN ID   TASK                      SUSPENDED AT          FIELDS
c3d4...  examples/suspend-wizard   2026-07-09T10:00:05Z  framework

$ dicode resume c3d4... framework=deno
resumed: continuation run e5f6...

$ dicode resume e5f6... confirmed=true
resumed: continuation run g7h8...

$ dicode logs g7h8...
{"project":"acme","framework":"deno","confirmed":true}
```

### Testing the steps directly

The shipped `task.test.ts` exercises each step as a plain function, mocking `dicode.suspend` to capture the request and throw (mirroring the fact that `suspend()` never returns) rather than driving a real suspend/resume round trip:

```ts
test("chooseFramework carries the project name forward and suspends to confirm", async () => {
  const { calls, suspend } = captureSuspend();
  try {
    await steps.chooseFramework({ dicode: { suspend }, input: { project_name: "acme" } } as never);
  } catch {
    /* suspend() throws by design */
  }
  assert.equal(calls[0].to, "confirm");
  assert.equal((calls[0].state as { project: string }).project, "acme");
});
```

This is the same pattern any task's `task.test.ts` uses for suspending handlers: call the handler directly with a hand-built `ctx`, assert on the recorded `suspend()` request instead of trying to await a call that never resolves.

## See also

- [Suspend & Resume](/concepts/suspend-resume) -- the full concept: auto-dispatch, JSON Schema forms, lifecycle, resume paths
- [SDK Globals -- dicode.suspend](/concepts/sdk#dicode-suspend) -- the API reference
- [Tasks](/concepts/tasks) -- `task.yaml` format
