import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-everything-task")
export class DcEverythingTask extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-everything-task .kernel-diagram {
          max-width: 600px;
          margin: 0 auto 3rem;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        dc-everything-task .kernel-layer {
          padding: 1.4rem 2rem;
          text-align: center;
          border: 1px solid var(--border);
          position: relative;
        }
        dc-everything-task .kernel-layer:first-child {
          border-radius: var(--radius) var(--radius) 0 0;
          background: var(--card-bg);
        }
        dc-everything-task .kernel-layer:nth-child(2) {
          background: var(--blue-tint);
          border-color: rgba(13,110,253,.3);
          border-style: dashed;
        }
        dc-everything-task .kernel-layer:last-child {
          border-radius: 0 0 var(--radius) var(--radius);
          background: var(--card-bg);
          border-top: 2px solid var(--blue);
        }
        dc-everything-task .kernel-layer h4 {
          font-size: .85rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: .3rem;
          text-transform: uppercase;
          letter-spacing: .06em;
        }
        dc-everything-task .kernel-layer p {
          color: var(--muted);
          font-size: .82rem;
          line-height: 1.5;
        }
        dc-everything-task .kernel-layer .replace-badge {
          position: absolute;
          top: .6rem;
          right: .8rem;
          font-size: .6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .05em;
          color: var(--sky);
          background: var(--blue-tint-strong);
          padding: .15rem .5rem;
          border-radius: 4px;
        }
        dc-everything-task .versus-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          max-width: 700px;
          margin: 0 auto;
        }
        dc-everything-task .versus-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.6rem;
        }
        dc-everything-task .versus-card.highlight {
          border-color: rgba(13,110,253,.4);
        }
        dc-everything-task .versus-card h4 {
          font-size: .85rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 1rem;
        }
        dc-everything-task .versus-card.highlight h4 {
          color: var(--sky);
        }
        dc-everything-task .versus-card ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: .5rem;
        }
        dc-everything-task .versus-card li {
          font-size: .85rem;
          color: var(--text);
          padding-left: 1.4rem;
          position: relative;
          line-height: 1.5;
        }
        dc-everything-task .versus-card li::before {
          position: absolute;
          left: 0;
          font-weight: 700;
        }
        dc-everything-task .versus-card:not(.highlight) li::before {
          content: '\u2014';
          color: var(--muted);
        }
        dc-everything-task .versus-card.highlight li::before {
          content: '\u2713';
          color: var(--green);
        }
        dc-everything-task .hook-text {
          text-align: center;
          color: var(--muted);
          font-size: 1rem;
          font-style: italic;
          margin-top: 2.5rem;
        }
        dc-everything-task .hook-text strong {
          color: var(--sky);
          font-style: normal;
        }
        @media (max-width: 640px) {
          dc-everything-task .versus-grid {
            grid-template-columns: 1fr;
          }
          dc-everything-task .kernel-layer {
            padding: 1rem 1.2rem;
          }
        }
      </style>
      <section id="everything-task" style="background: var(--bg-alt);">
        <div class="container">
          <p class="section-label reveal">Philosophy</p>
          <h2 class="section-title reveal">Everything is a task</h2>
          <p class="section-sub reveal">
            The AI engine, notifications, the web dashboard, MCP servers &mdash;
            they're all tasks. Replace any of them. Design your own automation platform.
          </p>

          <div class="kernel-diagram reveal">
            <div class="kernel-layer">
              <h4>Your Tasks</h4>
              <p>Automations, integrations, pipelines, monitoring</p>
            </div>
            <div class="kernel-layer">
              <span class="replace-badge">Replaceable</span>
              <h4>Platform Tasks</h4>
              <p>AI engine &middot; Web UI &middot; Notifications &middot; MCP servers</p>
            </div>
            <div class="kernel-layer">
              <h4>Task Kernel</h4>
              <p>Scheduler &middot; Runtimes &middot; Git sync &middot; Secrets &middot; Permissions &middot; SQLite</p>
            </div>
          </div>

          <div class="versus-grid stagger">
            <div class="versus-card">
              <h4>Other platforms</h4>
              <ul>
                <li>Features baked into the binary</li>
                <li>Customization = config flags</li>
                <li>You use what they ship</li>
                <li>Updates may break your workflow</li>
              </ul>
            </div>
            <div class="versus-card highlight">
              <h4>dicode</h4>
              <ul>
                <li>Features are tasks you can replace</li>
                <li>Customization = write a task</li>
                <li>You design your own platform</li>
                <li>Your tasks are yours, in git, forever</li>
              </ul>
            </div>
          </div>

          <p class="hook-text reveal">
            Don't like something? Don't file a feature request. <strong>Replace the task.</strong>
          </p>
        </div>
      </section>
    `;
  }
}
