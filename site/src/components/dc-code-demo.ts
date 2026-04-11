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
          gap: 3rem;
          align-items: center;
        }
        @media (max-width: 768px) {
          dc-code-demo .demo-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <section id="code" style="background: var(--navy2);">
        <div class="container">
          <div class="demo-grid">
            <div class="demo-text reveal-left">
              <h2>No black boxes, no surprises</h2>
              <p>Tasks are predictable code — TypeScript, Python, or Docker containers. You see every line. You can read, review, and adjust at any time.</p>
              <p>No vendor lock-in. No proprietary formats. Standard languages, standard git, standard tools. When something breaks, you look at the code — not a support ticket.</p>
              <div class="demo-pills">
                <span class="pill">TypeScript</span>
                <span class="pill">Python</span>
                <span class="pill">Docker</span>
                <span class="pill">Standard git</span>
                <span class="pill">Code review</span>
                <span class="pill">Full ownership</span>
              </div>
            </div>
            <div class="code-block reveal-right">
              <div class="code-header">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                <span class="filename">tasks/pr-digest/task.yaml</span>
              </div>
              <pre><code><span class="prop">name</span>: <span class="str">PR Digest</span>
<span class="prop">runtime</span>: <span class="str">deno</span>
<span class="prop">cron</span>: <span class="str">"0 9 * * 1-5"</span>
<span class="prop">params</span>:
  <span class="prop">repo</span>: { <span class="prop">type</span>: <span class="str">string</span>, <span class="prop">default</span>: <span class="str">"my-org/api"</span> }
<span class="prop">env</span>:
  - <span class="str">GITHUB_TOKEN</span>
  - <span class="str">SLACK_WEBHOOK</span></code></pre>
            </div>
          </div>

          <div style="margin-top: 2rem;">
            <div class="code-block reveal">
              <div class="code-header">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                <span class="filename">tasks/pr-digest/task.ts</span>
              </div>
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
      </section>
    `;
  }
}
