import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-control")
export class DcControl extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-control .control-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 2rem;
        }
        dc-control .control-card {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
        }
        dc-control .control-card h3 {
          margin: 0 0 1rem;
          color: #fff;
        }
        dc-control .control-card p {
          color: var(--muted);
          margin: 0;
          font-size: .95rem;
        }
        @media (max-width: 768px) {
          dc-control .control-cards {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <section id="control" style="background: var(--navy);">
        <div class="container">
          <p class="section-label reveal">Your Level of Control</p>
          <h2 class="section-title reveal">From full hands-on to full AI</h2>
          <p class="section-sub reveal">No coding knowledge? Let AI handle everything from the web dashboard. Expert developer? Write TypeScript and review every line. Move the dial anywhere between full AI and full control.</p>
          <div class="control-cards stagger">
            <div class="control-card">
              <h3>🛠️ Full Hands-On</h3>
              <p>Write task.yaml and task.ts yourself. Review every line. Deploy by pushing to git. Complete control, zero magic.</p>
            </div>
            <div class="control-card" style="border-color: rgba(13,110,253,.4);">
              <h3>🤝 AI-Assisted</h3>
              <p>Describe what you want in plain English. AI generates the code. You review and approve before it goes live. Best of both worlds.</p>
            </div>
            <div class="control-card">
              <h3>🚀 Full AI</h3>
              <p>AI writes, validates, tests, and commits autonomously via MCP. You just monitor. Or have another AI review it — wire up an AI reviewer that checks code quality before tasks go live.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
