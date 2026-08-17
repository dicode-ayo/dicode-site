import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-mcp-factory")
export class DcMcpFactory extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-mcp-factory .mcp-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--dicode-space-md);
          flex-wrap: wrap;
          margin-bottom: var(--dicode-space-2xl);
        }
        dc-mcp-factory .mcp-box {
          background: var(--dicode-card-bg);
          border: 1px solid var(--dicode-border);
          border-radius: var(--dicode-radius);
          padding: 1.2rem 1.6rem;
          text-align: center;
          min-width: 160px;
        }
        dc-mcp-factory .mcp-box h4 {
          font-size: .85rem;
          font-weight: var(--dicode-font-bold);
          color: var(--dicode-heading);
          margin-bottom: .2rem;
        }
        dc-mcp-factory .mcp-box p {
          font-size: .75rem;
          color: var(--dicode-muted);
          line-height: 1.4;
        }
        dc-mcp-factory .mcp-arrow {
          color: var(--dicode-sky);
          font-size: 1.5rem;
          font-weight: var(--dicode-font-bold);
          flex-shrink: 0;
        }
        dc-mcp-factory .mcp-arrow::before { content: "\u2192"; }
        dc-mcp-factory .mcp-compare {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--dicode-space-lg);
          max-width: 700px;
          margin: 0 auto;
        }
        dc-mcp-factory .mcp-card {
          background: var(--dicode-card-bg);
          border: 1px solid var(--dicode-border);
          border-radius: var(--dicode-radius);
          padding: var(--dicode-space-lg);
        }
        dc-mcp-factory .mcp-card.highlight {
          border-color: var(--dicode-border-dashed);
        }
        dc-mcp-factory .mcp-card h4 {
          font-size: .8rem;
          font-weight: var(--dicode-font-bold);
          color: var(--dicode-muted);
          text-transform: uppercase;
          letter-spacing: var(--dicode-tracking-wide);
          margin-bottom: .8rem;
        }
        dc-mcp-factory .mcp-card.highlight h4 { color: var(--dicode-sky); }
        dc-mcp-factory .mcp-card ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: .4rem;
        }
        dc-mcp-factory .mcp-card li {
          font-size: .85rem;
          color: var(--dicode-text);
          padding-left: var(--dicode-space-lg);
          position: relative;
          line-height: 1.5;
        }
        dc-mcp-factory .mcp-card li::before {
          position: absolute;
          left: 0;
          font-weight: var(--dicode-font-bold);
        }
        dc-mcp-factory .mcp-card:not(.highlight) li::before {
          content: '\u2014'; color: var(--dicode-muted);
        }
        dc-mcp-factory .mcp-card.highlight li::before {
          content: '\u2713'; color: var(--dicode-green);
        }
        @media (max-width: 900px) {
          dc-mcp-factory .mcp-flow { flex-direction: column; }
          dc-mcp-factory .mcp-arrow::before { content: "\u2193"; }
        }
        @media (max-width: 640px) {
          dc-mcp-factory .mcp-compare { grid-template-columns: 1fr; }
        }
      </style>
      <section id="mcp-factory" style="background: var(--dicode-bg);">
        <div class="container">
          <p class="section-label reveal">AI Toolkit</p>
          <h2 class="section-title reveal">Every task is an AI tool</h2>
          <p class="section-sub reveal">
            Write a task. It becomes a tool any AI agent can call via MCP.
            Your code, your git, your control. Like a tool marketplace &mdash;
            but you own everything.
          </p>

          <div class="mcp-flow stagger">
            <div class="mcp-box">
              <h4>You write a task</h4>
              <p>TypeScript, Python,<br>or Docker</p>
            </div>
            <div class="mcp-arrow"></div>
            <div class="mcp-box">
              <h4>It's in git</h4>
              <p>Versioned, reviewable,<br>auditable</p>
            </div>
            <div class="mcp-arrow"></div>
            <div class="mcp-box">
              <h4>AI agents discover it</h4>
              <p>Claude, Cursor, GPT<br>connect via MCP</p>
            </div>
            <div class="mcp-arrow"></div>
            <div class="mcp-box">
              <h4>They call it</h4>
              <p>Params from task.yaml<br>become tool schema</p>
            </div>
          </div>

          <div class="mcp-compare stagger">
            <div class="mcp-card">
              <h4>Tool marketplaces</h4>
              <ul>
                <li>Someone else's code</li>
                <li>Hosted somewhere opaque</li>
                <li>Hope it works</li>
                <li>No audit trail</li>
                <li>No customization</li>
              </ul>
            </div>
            <div class="mcp-card highlight">
              <h4>dicode MCP</h4>
              <ul>
                <li>Your code, your git repo</li>
                <li>Runs on your machine</li>
                <li>Full run history + logs</li>
                <li>Every change is a commit</li>
                <li>Fork and modify anything</li>
              </ul>
            </div>
          </div>
          <p class="reveal" style="text-align:center; margin-top:var(--dicode-space-xl);">
            <a href="/docs/concepts/ai-agent" style="color:var(--dicode-sky); text-decoration:none; font-size:.85rem; font-weight:var(--dicode-font-semibold);">Read more &rarr;</a>
          </p>
        </div>
      </section>
    `;
  }
}
