import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-multi-machine")
export class DcMultiMachine extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-multi-machine .fleet-diagram {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 2rem;
          align-items: center;
          max-width: 800px;
          margin: 0 auto;
        }
        dc-multi-machine .fleet-repo {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.4rem;
          text-align: center;
        }
        dc-multi-machine .fleet-repo .repo-icon {
          font-size: 2.5rem;
          margin-bottom: .6rem;
        }
        dc-multi-machine .fleet-repo h4 {
          color: var(--heading);
          font-size: .9rem;
          font-weight: 700;
          margin-bottom: .2rem;
        }
        dc-multi-machine .fleet-repo p {
          color: var(--muted);
          font-size: .75rem;
        }
        dc-multi-machine .fleet-machines {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        dc-multi-machine .fleet-machine {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.2rem;
          position: relative;
        }
        dc-multi-machine .fleet-machine::before {
          content: '';
          position: absolute;
          left: -1.5rem;
          top: 50%;
          width: 1rem;
          border-top: 2px dashed var(--border);
        }
        dc-multi-machine .fleet-machine h4 {
          font-size: .85rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: .2rem;
        }
        dc-multi-machine .fleet-machine p {
          font-size: .75rem;
          color: var(--muted);
          line-height: 1.4;
        }
        dc-multi-machine .fleet-machine .machine-tag {
          display: inline-block;
          font-size: .65rem;
          font-weight: 600;
          color: var(--sky);
          background: var(--blue-tint);
          padding: .15rem .5rem;
          border-radius: 4px;
          margin-top: .4rem;
        }
        dc-multi-machine .fleet-footer {
          text-align: center;
          margin-top: 2.5rem;
          color: var(--muted);
          font-size: .9rem;
        }
        dc-multi-machine .fleet-footer strong {
          color: var(--sky);
        }
        @media (max-width: 768px) {
          dc-multi-machine .fleet-diagram {
            grid-template-columns: 1fr;
          }
          dc-multi-machine .fleet-machine::before { display: none; }
        }
        @media (max-width: 640px) {
          dc-multi-machine .fleet-machines {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <section id="multi-machine" style="background: var(--bg);">
        <div class="container">
          <p class="section-label reveal">Distributed</p>
          <h2 class="section-title reveal">One repo, many machines</h2>
          <p class="section-sub reveal">
            Same git repo. Different machines. Each running the tasks that belong there.
            Git push &mdash; all update within 30 seconds.
          </p>

          <div class="fleet-diagram stagger">
            <div class="fleet-repo">
              <div class="repo-icon">&#x1F4C1;</div>
              <h4>One git repo</h4>
              <p>Single source of truth</p>
            </div>

            <div class="fleet-machines">
              <div class="fleet-machine">
                <h4>&#x1F5A5;&#xFE0F; Home Server</h4>
                <p>Monitoring, backups, media processing</p>
                <span class="machine-tag">24/7 tasks</span>
              </div>
              <div class="fleet-machine">
                <h4>&#x1F4BB; Laptop</h4>
                <p>Dev tasks, webhook receivers, throwaway UIs</p>
                <span class="machine-tag">Interactive</span>
              </div>
              <div class="fleet-machine">
                <h4>&#x2601;&#xFE0F; VPS</h4>
                <p>Public webhook endpoints, scheduled jobs</p>
                <span class="machine-tag">Always-on</span>
              </div>
              <div class="fleet-machine">
                <h4>&#x1F353; Raspberry Pi</h4>
                <p>IoT data collection, sensor polling</p>
                <span class="machine-tag">Edge</span>
              </div>
            </div>
          </div>

          <p class="fleet-footer reveal">
            No orchestration layer. No service mesh. No Kubernetes.
            Just <strong>git + multiple binaries</strong>.
          </p>
        </div>
      </section>
    `;
  }
}
