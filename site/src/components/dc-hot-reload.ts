import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-hot-reload")
export class DcHotReload extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-hot-reload .reload-demo {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        dc-hot-reload .terminal {
          background: var(--code-bg);
          border: 1px solid var(--code-border);
          border-radius: var(--radius);
          overflow: hidden;
        }
        dc-hot-reload .terminal-header {
          display: flex; align-items: center; gap: .5rem;
          padding: .6rem 1rem;
          border-bottom: 1px solid var(--code-border);
        }
        dc-hot-reload .terminal-header .dot { width: 10px; height: 10px; border-radius: 50%; }
        dc-hot-reload .terminal-header .dot:nth-child(1) { background: #ff5f57; }
        dc-hot-reload .terminal-header .dot:nth-child(2) { background: #ffbd2e; }
        dc-hot-reload .terminal-header .dot:nth-child(3) { background: #28c840; }
        dc-hot-reload .terminal-header span:last-child {
          margin-left: auto;
          color: var(--code-filename);
          font-size: .72rem;
          font-family: 'Fira Code', 'Cascadia Code', monospace;
        }
        dc-hot-reload .terminal pre {
          padding: 1.2rem;
          font-family: 'Fira Code', 'Cascadia Code', monospace;
          font-size: .78rem;
          line-height: 1.7;
          color: var(--code-text);
          overflow-x: auto;
        }
        dc-hot-reload .t-muted { color: var(--muted); }
        dc-hot-reload .t-green { color: var(--green); }
        dc-hot-reload .t-blue { color: var(--sky); }
        dc-hot-reload .t-yellow { color: var(--yellow); }

        dc-hot-reload .reload-text h3 {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--heading);
          letter-spacing: -.02em;
          margin-bottom: .8rem;
        }
        dc-hot-reload .reload-text p {
          color: var(--muted);
          font-size: .95rem;
          line-height: 1.7;
          margin-bottom: 1rem;
        }
        dc-hot-reload .reload-stats {
          display: flex;
          gap: 2rem;
          margin-top: 1.5rem;
        }
        dc-hot-reload .stat {
          text-align: center;
        }
        dc-hot-reload .stat-num {
          font-size: 2rem;
          font-weight: 800;
          color: var(--sky);
          line-height: 1;
        }
        dc-hot-reload .stat-label {
          font-size: .75rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: .05em;
          margin-top: .3rem;
        }
        @media (max-width: 900px) {
          dc-hot-reload .reload-demo {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          dc-hot-reload .terminal pre { font-size: .68rem; padding: .8rem; }
          dc-hot-reload .reload-stats { gap: 1.2rem; }
          dc-hot-reload .stat-num { font-size: 1.5rem; }
        }
      </style>
      <section id="hot-reload" style="background: var(--bg-alt);">
        <div class="container">
          <div class="reload-demo">
            <div class="terminal reveal-left">
              <div class="terminal-header">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                <span>dicoded</span>
              </div>
              <pre><span class="t-muted">[10:00:01]</span> <span class="t-green">&#10003;</span> task/slack-digest registered <span class="t-muted">(a1b2c3)</span>
<span class="t-muted">[10:00:01]</span>   next run: 10:05

<span class="t-muted">[10:00:14]</span> <span class="t-yellow">~</span> file changed: tasks/slack-digest/task.ts
<span class="t-muted">[10:00:14]</span> <span class="t-green">&#10003;</span> task/slack-digest <span class="t-blue">updated</span> <span class="t-muted">(d4e5f6)</span>
<span class="t-muted">[10:00:14]</span>   next run: 10:05

<span class="t-muted">[10:00:14]</span> <span class="t-muted">100ms from save to live</span></pre>
            </div>

            <div class="reload-text reveal-right">
              <h3>Save the file. It's already running.</h3>
              <p>
                Local source uses fsnotify &mdash; file changes are detected in ~100ms.
                No restart, no redeploy, no build step. The reconciler computes a content
                hash; if it changed, the task is re-registered instantly.
              </p>
              <p>
                For daemon tasks, the process restarts automatically with new code.
                Git source: push + webhook = live in under 1 second.
              </p>
              <div class="reload-stats">
                <div class="stat">
                  <div class="stat-num">100ms</div>
                  <div class="stat-label">Local reload</div>
                </div>
                <div class="stat">
                  <div class="stat-num">&lt;1s</div>
                  <div class="stat-label">Git + webhook</div>
                </div>
                <div class="stat">
                  <div class="stat-num">0</div>
                  <div class="stat-label">Deploy steps</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
