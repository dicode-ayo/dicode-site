import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-throwaway-ui")
export class DcThrowawayUi extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-throwaway-ui .ui-examples {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2.5rem;
        }
        dc-throwaway-ui .ui-example {
          background: var(--code-bg);
          border: 1px solid var(--code-border);
          border-radius: var(--radius);
          overflow: hidden;
        }
        dc-throwaway-ui .ui-example-header {
          display: flex; align-items: center; gap: .5rem;
          padding: .5rem 1rem;
          border-bottom: 1px solid var(--code-border);
        }
        dc-throwaway-ui .ui-example-header .dot { width: 10px; height: 10px; border-radius: 50%; }
        dc-throwaway-ui .ui-example-header .dot:nth-child(1) { background: #ff5f57; }
        dc-throwaway-ui .ui-example-header .dot:nth-child(2) { background: #ffbd2e; }
        dc-throwaway-ui .ui-example-header .dot:nth-child(3) { background: #28c840; }
        dc-throwaway-ui .ui-example-header span:last-child {
          margin-left: auto;
          color: var(--code-filename);
          font-size: .7rem;
          font-family: 'Fira Code', 'Cascadia Code', monospace;
        }
        dc-throwaway-ui .ui-example pre {
          padding: 1rem;
          font-family: 'Fira Code', 'Cascadia Code', monospace;
          font-size: .72rem;
          line-height: 1.6;
          color: var(--code-text);
          overflow-x: auto;
        }
        dc-throwaway-ui .use-cases {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        dc-throwaway-ui .use-case {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.2rem;
          text-align: center;
        }
        dc-throwaway-ui .use-case-icon {
          font-size: 1.8rem;
          margin-bottom: .5rem;
        }
        dc-throwaway-ui .use-case h4 {
          font-size: .85rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: .2rem;
        }
        dc-throwaway-ui .use-case p {
          font-size: .75rem;
          color: var(--muted);
          line-height: 1.4;
        }
        dc-throwaway-ui .hook-text {
          text-align: center;
          color: var(--muted);
          font-size: 1rem;
          font-style: italic;
          margin-top: 2rem;
        }
        dc-throwaway-ui .hook-text strong {
          color: var(--sky);
          font-style: normal;
        }
        @media (max-width: 900px) {
          dc-throwaway-ui .ui-examples { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          dc-throwaway-ui .ui-example pre { font-size: .65rem; padding: .8rem; }
          dc-throwaway-ui .use-cases { grid-template-columns: 1fr 1fr; }
        }
      </style>
      <section id="throwaway-ui" style="background: var(--bg-alt);">
        <div class="container">
          <p class="section-label reveal">Instant Frontends</p>
          <h2 class="section-title reveal">UIs without frameworks</h2>
          <p class="section-sub reveal">
            Daemon tasks can serve HTTP. Need a form, a dashboard, a webhook visualizer?
            Write a task. It serves HTML. No React, no build step, no deployment pipeline.
          </p>

          <div class="ui-examples stagger">
            <div class="ui-example">
              <div class="ui-example-header">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                <span>webhook-viewer/task.ts</span>
              </div>
              <pre><code><span class="kw">const</span> events: <span class="prop">any</span>[] = [];

Deno.<span class="fn">serve</span>({ <span class="prop">port</span>: <span class="num">3001</span> }, <span class="kw">async</span> (req) => {
  <span class="kw">if</span> (req.method === <span class="str">"POST"</span>) {
    events.<span class="fn">push</span>(<span class="kw">await</span> req.<span class="fn">json</span>());
    <span class="kw">return new</span> <span class="fn">Response</span>(<span class="str">"ok"</span>);
  }
  <span class="kw">return new</span> <span class="fn">Response</span>(<span class="str">\`
    &lt;h1&gt;Webhook Events&lt;/h1&gt;
    &lt;pre&gt;\${JSON.stringify(events)}&lt;/pre&gt;
    &lt;script&gt;setTimeout(()=>
      location.reload(),2000)&lt;/script&gt;
  \`</span>, { <span class="prop">headers</span>: {
    <span class="str">"content-type"</span>: <span class="str">"text/html"</span>
  }});
});</code></pre>
            </div>

            <div class="ui-example">
              <div class="ui-example-header">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                <span>team-poll/task.ts</span>
              </div>
              <pre><code><span class="kw">const</span> kv = dicode.kv;

Deno.<span class="fn">serve</span>({ <span class="prop">port</span>: <span class="num">3002</span> }, <span class="kw">async</span> (req) => {
  <span class="kw">if</span> (req.method === <span class="str">"POST"</span>) {
    <span class="kw">const</span> form = <span class="kw">await</span> req.<span class="fn">formData</span>();
    <span class="kw">await</span> kv.<span class="fn">set</span>(
      <span class="str">\`vote:\${Date.now()}\`</span>,
      form.<span class="fn">get</span>(<span class="str">"choice"</span>)
    );
    <span class="kw">return</span> Response.<span class="fn">redirect</span>(<span class="str">"/"</span>);
  }
  <span class="kw">const</span> votes = <span class="kw">await</span> kv.<span class="fn">list</span>(<span class="str">"vote:"</span>);
  <span class="kw">return new</span> <span class="fn">Response</span>(<span class="str">\`
    &lt;form method="POST"&gt;
      &lt;h2&gt;Friday lunch?&lt;/h2&gt;
      &lt;button name="choice"
        value="pizza"&gt;Pizza&lt;/button&gt;
      &lt;button name="choice"
        value="sushi"&gt;Sushi&lt;/button&gt;
    &lt;/form&gt;
    &lt;p&gt;\${votes.length} votes&lt;/p&gt;
  \`</span>, { <span class="prop">headers</span>: {
    <span class="str">"content-type"</span>: <span class="str">"text/html"</span>
  }});
});</code></pre>
            </div>
          </div>

          <div class="use-cases stagger">
            <div class="use-case">
              <div class="use-case-icon">&#x1F50D;</div>
              <h4>Webhook Visualizer</h4>
              <p>Debug payloads with a live-updating page</p>
            </div>
            <div class="use-case">
              <div class="use-case-icon">&#x1F4CA;</div>
              <h4>Status Dashboard</h4>
              <p>Aggregate task results into a custom view</p>
            </div>
            <div class="use-case">
              <div class="use-case-icon">&#x1F4CB;</div>
              <h4>Polls &amp; Forms</h4>
              <p>Collect team input, stored in KV</p>
            </div>
            <div class="use-case">
              <div class="use-case-icon">&#x2705;</div>
              <h4>Approval Gates</h4>
              <p>Accept/Reject buttons for human-in-the-loop</p>
            </div>
            <div class="use-case">
              <div class="use-case-icon">&#x1F3AE;</div>
              <h4>Simulation Runner</h4>
              <p>Pick params, run, see results visually</p>
            </div>
          </div>

          <p class="hook-text reveal">
            Not every UI needs a framework. <strong>Some just need a task.</strong>
          </p>
        </div>
      </section>
    `;
  }
}
