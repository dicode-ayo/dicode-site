import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-how-it-works")
export class DcHowItWorks extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-how-it-works section { padding: 100px 2rem; background: var(--navy2); }
        dc-how-it-works .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 2rem; }
        dc-how-it-works .step {
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 2rem; position: relative; overflow: hidden;
        }
        dc-how-it-works .step::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--blue), var(--sky));
          transform: scaleX(0); transform-origin: left; transition: transform .4s ease;
        }
        dc-how-it-works .step:hover::after { transform: scaleX(1); }
        dc-how-it-works .step-num {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(13,110,253,.18); border: 1.5px solid rgba(13,110,253,.4);
          color: var(--sky); font-weight: 800; font-size: .9rem;
          display: flex; align-items: center; justify-content: center; margin-bottom: 1.2rem;
        }
        dc-how-it-works .step h3 { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: .5rem; }
        dc-how-it-works .step p { color: var(--muted); font-size: .9rem; line-height: 1.65; }
        @media (max-width: 640px) {
          dc-how-it-works section { padding: 60px 1rem; }
          dc-how-it-works .steps { grid-template-columns: 1fr; gap: 1rem; }
        }
      </style>
      <section id="how">
        <div class="container">
          <p class="section-label reveal">How it works</p>
          <h2 class="section-title reveal">From idea to running automation in four steps</h2>
          <p class="section-sub reveal">No boilerplate, no deploy pipeline, no infrastructure to manage. Just describe, generate, and run.</p>
          <div class="steps stagger">
            <div class="step">
              <div class="step-num">1</div>
              <h3>Describe in plain English</h3>
              <p>Use the web dashboard, CLI, or let an AI agent create tasks via MCP. Or write TypeScript/Python yourself — you choose the level of control.</p>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <h3>Code in seconds, live instantly</h3>
              <p>AI generates validated task code — task.yaml + task.ts — and saves it to your tasks directory. Edit locally? Changes are live in ~100ms via filesystem watching. No build step, no deployment, no restart.</p>
            </div>
            <div class="step">
              <div class="step-num">3</div>
              <h3>GitOps reconciliation</h3>
              <p>dicode watches all your sources — local directories, git repos, community stores — via TaskSet manifests. Content hashes, automatic diff, zero restarts. Like ArgoCD, but for automation tasks.</p>
            </div>
            <div class="step">
              <div class="step-num">4</div>
              <h3>Test, monitor, iterate</h3>
              <p>Run tasks from the web dashboard or CLI. Watch live logs. Chain tasks together. Set up failure alerts. Review history. Test before production. All from one place.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
