import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-code-demo")
export class DcCodeDemo extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-code-demo .demo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-2xl);
          align-items: center;
        }

        /* Combined code block — single card with multiple tabs */
        dc-code-demo .code-card {
          background: var(--code-bg);
          border: 1px solid var(--code-border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }
        dc-code-demo .code-tabs {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          border-bottom: 1px solid var(--code-border);
          background: var(--code-bg);
        }
        dc-code-demo .code-tabs .dots {
          display: flex; gap: 6px; margin-right: var(--space-md);
        }
        dc-code-demo .code-tabs .dot {
          width: 12px; height: 12px; border-radius: var(--radius-full);
        }
        dc-code-demo .code-tabs .dot:nth-child(1) { background: #ff5f57; }
        dc-code-demo .code-tabs .dot:nth-child(2) { background: #ffbd2e; }
        dc-code-demo .code-tabs .dot:nth-child(3) { background: #28c840; }
        dc-code-demo .code-tabs .tab {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          color: var(--code-filename);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-sm);
        }
        dc-code-demo .code-tabs .tab.active {
          color: var(--code-text);
          background: var(--blue-tint);
        }
        dc-code-demo .code-body {
          display: grid;
          grid-template-columns: 1fr;
        }
        dc-code-demo .code-pane {
          padding: var(--space-lg);
          overflow-x: auto;
        }
        dc-code-demo .code-pane + .code-pane {
          border-top: 1px solid var(--code-border);
        }
        dc-code-demo .code-pane-label {
          display: block;
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          color: var(--code-filename);
          margin-bottom: var(--space-sm);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
        }
        dc-code-demo .code-pane pre {
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          line-height: var(--leading-normal);
          color: var(--code-text);
        }

        @media (max-width: 900px) {
          dc-code-demo .demo-grid {
            grid-template-columns: 1fr;
            gap: var(--space-xl);
          }
        }
        @media (max-width: 640px) {
          dc-code-demo .code-pane { padding: var(--space-md); }
          dc-code-demo .code-pane pre { font-size: var(--text-xs); }
          dc-code-demo .code-tabs { padding: var(--space-xs) var(--space-sm); }
          dc-code-demo .code-tabs .tab { font-size: .65rem; padding: 2px 6px; }
        }
      </style>
      <section id="code" style="background: var(--bg-alt);">
        <div class="container">
          <div class="demo-grid">
            <div class="demo-text reveal-left">
              <h2>No black boxes, no surprises</h2>
              <p>
                Tasks are predictable code — TypeScript, Python, or Docker containers.
                You see every line. You can read, review, and adjust at any time.
              </p>
              <p>
                No vendor lock-in. No proprietary formats. Standard languages, standard
                git, standard tools. When something breaks, you look at the code — not
                a support ticket.
              </p>
              <div class="demo-pills">
                <span class="pill">TypeScript</span>
                <span class="pill">Python</span>
                <span class="pill">Docker</span>
                <span class="pill">Standard git</span>
                <span class="pill">Code review</span>
                <span class="pill">Full ownership</span>
              </div>
            </div>

            <div class="code-card reveal-right">
              <div class="code-tabs">
                <div class="dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
                <span class="tab active">task.yaml</span>
                <span class="tab active">task.ts</span>
              </div>
              <div class="code-body">
                <div class="code-pane">
                  <span class="code-pane-label">tasks/pr-digest/task.yaml</span>
                  <pre><code><span class="prop">name</span>: <span class="str">PR Digest</span>
<span class="prop">runtime</span>: <span class="str">deno</span>
<span class="prop">cron</span>: <span class="str">"0 9 * * 1-5"</span>
<span class="prop">params</span>:
  <span class="prop">repo</span>: { <span class="prop">type</span>: <span class="str">string</span>, <span class="prop">default</span>: <span class="str">"my-org/api"</span> }
<span class="prop">env</span>:
  - <span class="str">GITHUB_TOKEN</span>
  - <span class="str">SLACK_WEBHOOK</span></code></pre>
                </div>
                <div class="code-pane">
                  <span class="code-pane-label">tasks/pr-digest/task.ts</span>
                  <pre><code><span class="cmt">// That's it. Real code you can read, review, and debug.</span>

<span class="kw">const</span> repo = <span class="kw">await</span> params.<span class="fn">get</span>(<span class="str">"repo"</span>) ?? <span class="str">"my-org/api"</span>;
<span class="kw">const</span> resp = <span class="kw">await</span> <span class="fn">fetch</span>(
  <span class="str">\`https://api.github.com/repos/\${repo}/pulls?state=open\`</span>,
  { <span class="prop">headers</span>: { <span class="prop">Authorization</span>: <span class="str">\`Bearer \${Deno.env.<span class="fn">get</span>(<span class="str">"GITHUB_TOKEN"</span>)}\`</span> } }
);
<span class="kw">const</span> prs = <span class="kw">await</span> resp.<span class="fn">json</span>();

<span class="kw">await</span> <span class="fn">fetch</span>(Deno.env.<span class="fn">get</span>(<span class="str">"SLACK_WEBHOOK"</span>), {
  <span class="prop">method</span>: <span class="str">"POST"</span>,
  <span class="prop">body</span>: JSON.<span class="fn">stringify</span>({ <span class="prop">text</span>: <span class="str">\`\${prs.length} open PRs in \${repo}\`</span> })
});</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
