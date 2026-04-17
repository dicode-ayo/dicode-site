import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-ai-loop")
export class DcAiLoop extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-ai-loop .loop-stages {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          margin-bottom: 3rem;
        }
        dc-ai-loop .loop-stage {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.4rem 1rem;
          text-align: center;
          position: relative;
        }
        dc-ai-loop .loop-stage::after {
          content: '\u2192';
          position: absolute;
          right: -0.7rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--sky);
          font-size: 1.2rem;
          font-weight: 700;
        }
        dc-ai-loop .loop-stage:last-child::after { content: none; }
        dc-ai-loop .loop-stage .stage-num {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--blue-tint-strong); border: 1.5px solid rgba(13,110,253,.4);
          color: var(--sky); font-weight: 800; font-size: .8rem;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto .8rem;
        }
        dc-ai-loop .loop-stage h4 {
          font-size: .85rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: .3rem;
        }
        dc-ai-loop .loop-stage p {
          color: var(--muted);
          font-size: .75rem;
          line-height: 1.4;
        }

        dc-ai-loop .compare-table {
          width: 100%;
          border-collapse: collapse;
          font-size: .82rem;
          margin-top: 2.5rem;
        }
        dc-ai-loop .compare-table th {
          text-align: center;
          padding: .7rem .6rem;
          color: var(--muted);
          font-weight: 600;
          font-size: .75rem;
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        dc-ai-loop .compare-table th:first-child { text-align: left; }
        dc-ai-loop .compare-table th.hl { color: var(--sky); }
        dc-ai-loop .compare-table thead tr { border-bottom: 2px solid var(--border); }
        dc-ai-loop .compare-table tbody tr { border-bottom: 1px solid var(--border); }
        dc-ai-loop .compare-table tbody tr:last-child { border-bottom: none; }
        dc-ai-loop .compare-table td { padding: .55rem .6rem; color: var(--text); }
        dc-ai-loop .compare-table td:not(:first-child) { text-align: center; }
        dc-ai-loop .compare-table .yes { color: var(--green); font-weight: 700; }
        dc-ai-loop .compare-table .no { color: var(--muted); }

        @media (max-width: 900px) {
          dc-ai-loop .loop-stages {
            grid-template-columns: repeat(3, 1fr);
          }
          dc-ai-loop .loop-stage::after { content: none; }
        }
        @media (max-width: 640px) {
          dc-ai-loop .loop-stages {
            grid-template-columns: 1fr 1fr;
            gap: .8rem;
          }
          dc-ai-loop .compare-table { font-size: .72rem; }
          dc-ai-loop .compare-table th,
          dc-ai-loop .compare-table td { padding: .4rem .3rem; }
        }
      </style>
      <section id="ai-loop" style="background: var(--bg);">
        <div class="container">
          <p class="section-label reveal">AI Lifecycle</p>
          <h2 class="section-title reveal">AI doesn't stop at code generation</h2>
          <p class="section-sub reveal">
            Every other tool stops at "AI helps you write code." dicode closes the full lifecycle
            loop &mdash; from natural language to self-healing automation. Every step is a git commit
            you can review.
          </p>

          <div class="loop-stages stagger">
            <div class="loop-stage">
              <div class="stage-num">1</div>
              <h4>Create</h4>
              <p>Describe in plain English. AI generates task.yaml + task.ts.</p>
            </div>
            <div class="loop-stage">
              <div class="stage-num">2</div>
              <h4>Validate</h4>
              <p>AI checks cron syntax, permissions, error handling, anti-patterns.</p>
            </div>
            <div class="loop-stage">
              <div class="stage-num">3</div>
              <h4>Deploy</h4>
              <p>Git commit triggers reconciler. Live in seconds. Zero human steps.</p>
            </div>
            <div class="loop-stage">
              <div class="stage-num">4</div>
              <h4>Monitor</h4>
              <p>AI watches runs, detects failure patterns, response time changes.</p>
            </div>
            <div class="loop-stage">
              <div class="stage-num">5</div>
              <h4>Fix</h4>
              <p>Task fails. AI reads error + code, commits a fix, redeploys automatically.</p>
            </div>
          </div>

          <div class="reveal" style="overflow-x: auto;">
            <table class="compare-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th class="hl">dicode</th>
                  <th>Windmill</th>
                  <th>n8n</th>
                  <th>GitHub Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Create</td>
                  <td class="yes">AI generates full task</td>
                  <td>AI code assist</td>
                  <td>AI suggests nodes</td>
                  <td class="no">&mdash;</td>
                </tr>
                <tr>
                  <td>Validate</td>
                  <td class="yes">AI validates before deploy</td>
                  <td class="no">Manual</td>
                  <td class="no">Manual</td>
                  <td>CI checks (you write)</td>
                </tr>
                <tr>
                  <td>Deploy</td>
                  <td class="yes">Auto &mdash; git commit = live</td>
                  <td>Manual or git-sync</td>
                  <td class="no">Manual</td>
                  <td>Push-triggered</td>
                </tr>
                <tr>
                  <td>Monitor</td>
                  <td class="yes">AI watches &amp; detects</td>
                  <td class="no">Dashboard (manual)</td>
                  <td class="no">Dashboard (manual)</td>
                  <td class="no">Logs (manual)</td>
                </tr>
                <tr>
                  <td>Fix</td>
                  <td class="yes">AI diagnoses &amp; patches</td>
                  <td class="no">You fix it</td>
                  <td class="no">You fix it</td>
                  <td class="no">You fix it</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }
}
