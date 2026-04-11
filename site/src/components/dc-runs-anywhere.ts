import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-runs-anywhere")
export class DcRunsAnywhere extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-runs-anywhere .device-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.2rem; }
        dc-runs-anywhere .device-item {
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 1.5rem 1rem;
          text-align: center; transition: border-color .25s, transform .2s;
        }
        dc-runs-anywhere .device-item:hover { border-color: rgba(160,196,255,.3); transform: translateY(-2px); }
        dc-runs-anywhere .device-icon { font-size: 2rem; margin-bottom: .6rem; }
        dc-runs-anywhere .device-item h4 { font-size: .9rem; font-weight: 700; color: #fff; margin-bottom: .25rem; }
        dc-runs-anywhere .device-item p { font-size: .78rem; color: var(--muted); }
        @media (max-width: 768px) {
          dc-runs-anywhere .device-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          dc-runs-anywhere .device-grid { grid-template-columns: repeat(2, 1fr); gap: .8rem; }
        }
        @media (max-width: 380px) {
          dc-runs-anywhere .device-grid { grid-template-columns: 1fr 1fr; }
        }
      </style>
      <section id="runs-anywhere" style="background: var(--navy2); padding: 100px 2rem;">
        <div class="container">
          <p class="section-label reveal">Runs Anywhere</p>
          <h2 class="section-title reveal">You own everything</h2>
          <p class="section-sub reveal">Single binary, no dependencies. Runs on any OS. Local encrypted secrets that never leave your machine. Full dashboard, full API, full MCP server — wherever it runs.</p>
          <div class="device-grid stagger">
            <div class="device-item">
              <div class="device-icon">&#x1F4BB;</div>
              <h4>macOS / Linux / Windows</h4>
              <p>System tray + web dashboard</p>
            </div>
            <div class="device-item">
              <div class="device-icon">&#x1F353;</div>
              <h4>Raspberry Pi</h4>
              <p>ARM binary, runs on a shelf</p>
            </div>
            <div class="device-item">
              <div class="device-icon">&#x1F433;</div>
              <h4>Docker</h4>
              <p>One-line docker run</p>
            </div>
            <div class="device-item">
              <div class="device-icon">&#x2638;&#xFE0F;</div>
              <h4>Kubernetes</h4>
              <p>Helm chart, production-ready</p>
            </div>
            <div class="device-item">
              <div class="device-icon">&#x1F5C4;&#xFE0F;</div>
              <h4>SQLite or Postgres</h4>
              <p>Embedded or bring your own</p>
            </div>
            <div class="device-item">
              <div class="device-icon">&#x1F510;</div>
              <h4>Local Secrets</h4>
              <p>Encrypted, never leaves your machine</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
