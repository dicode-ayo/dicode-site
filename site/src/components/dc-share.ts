import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-share")
export class DcShare extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-share .flow-diagram {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-top: 2rem;
        }
        dc-share .flow-box {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          padding: 1.5rem 2rem;
          text-align: center;
          min-width: 160px;
        }
        dc-share .flow-box h4 {
          margin: 0 0 .5rem;
          color: #fff;
        }
        dc-share .flow-box p {
          margin: 0;
          color: var(--muted);
          font-size: .9rem;
        }
        dc-share .flow-arrow {
          font-size: 2rem;
          color: var(--sky);
          font-weight: bold;
        }
        @media (max-width: 768px) {
          dc-share .flow-diagram {
            flex-direction: column;
          }
          dc-share .flow-arrow {
            transform: rotate(90deg);
          }
        }
      </style>
      <section id="share" style="background: var(--navy2);">
        <div class="container">
          <p class="section-label reveal">Share & Compose</p>
          <h2 class="section-title reveal">Tasks are building blocks</h2>
          <p class="section-sub reveal">Share, install, and chain tasks together into complex workflows. One task's output feeds the next.</p>

          <div class="flow-diagram reveal">
            <div class="flow-box">
              <h4>Task A</h4>
              <p>Fetch data from API</p>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-box">
              <h4>Task B</h4>
              <p>Process & transform</p>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-box">
              <h4>Task C</h4>
              <p>Post to Slack</p>
            </div>
          </div>

          <div class="features-grid stagger" style="margin-top: 3rem;">
            <div class="feature-card">
              <div class="feature-icon">📦</div>
              <h3>Install from Git</h3>
              <p>Any task from anyone can be used if shared — it's just a git repo with task folders. Point to a git URL. That's it.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔗</div>
              <h3>Chain Into Workflows</h3>
              <p>Tasks compose into complex workflows via chaining. One task's output becomes the next task's input. Build pipelines declaratively.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏪</div>
              <h3>Community Store</h3>
              <p>Publish approved tasks to the community store. Share privately via git permissions — the same model as private repos.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
