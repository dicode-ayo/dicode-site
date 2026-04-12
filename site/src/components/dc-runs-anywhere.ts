import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

import appleIcon from "@iconify-icons/logos/apple.js";
import linuxIcon from "@iconify-icons/logos/linux-tux.js";
import windowsIcon from "@iconify-icons/logos/microsoft-windows-icon.js";
import raspberryPiIcon from "@iconify-icons/logos/raspberry-pi.js";
import dockerIcon from "@iconify-icons/logos/docker-icon.js";
import kubernetesIcon from "@iconify-icons/logos/kubernetes.js";
import postgresIcon from "@iconify-icons/logos/postgresql.js";
import sqliteIcon from "@iconify-icons/logos/sqlite.js";

import { renderIcon } from "../utils/icon.js";

@customElement("dc-runs-anywhere")
export class DcRunsAnywhere extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-runs-anywhere .device-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.2rem; }
        dc-runs-anywhere .device-item {
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 1.8rem 1.2rem;
          text-align: center; transition: border-color .25s, transform .2s;
        }
        dc-runs-anywhere .device-item:hover { border-color: rgba(160,196,255,.3); transform: translateY(-2px); }
        dc-runs-anywhere .device-icons {
          display: flex; align-items: center; justify-content: center;
          gap: .5rem; margin-bottom: .8rem;
        }
        dc-runs-anywhere .device-icons svg { width: 32px; height: 32px; }
        dc-runs-anywhere .device-item h4 { font-size: .9rem; font-weight: 700; color: var(--heading); margin-bottom: .25rem; }
        dc-runs-anywhere .device-item p { font-size: .78rem; color: var(--muted); line-height: 1.4; }
        @media (max-width: 768px) {
          dc-runs-anywhere .device-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          dc-runs-anywhere .device-grid { grid-template-columns: repeat(2, 1fr); gap: .8rem; }
          dc-runs-anywhere .device-item { padding: 1.2rem .8rem; }
          dc-runs-anywhere .device-icons svg { width: 26px; height: 26px; }
        }
        @media (max-width: 380px) {
          dc-runs-anywhere .device-grid { grid-template-columns: 1fr 1fr; }
        }
      </style>
      <section id="runs-anywhere" style="background: var(--bg-alt);">
        <div class="container">
          <p class="section-label reveal">Runs Anywhere</p>
          <h2 class="section-title reveal">You own everything</h2>
          <p class="section-sub reveal">
            Single binary, no dependencies. Runs on any OS. Local encrypted secrets that never leave your machine.
            Full dashboard, full API, full MCP server — wherever it runs.
          </p>
          <div class="device-grid stagger">
            <div class="device-item">
              <div class="device-icons">
                ${renderIcon(appleIcon)} ${renderIcon(linuxIcon)} ${renderIcon(windowsIcon)}
              </div>
              <h4>macOS · Linux · Windows</h4>
              <p>System tray + web dashboard</p>
            </div>
            <div class="device-item">
              <div class="device-icons">${renderIcon(raspberryPiIcon)}</div>
              <h4>Raspberry Pi</h4>
              <p>ARM binary, runs on a shelf</p>
            </div>
            <div class="device-item">
              <div class="device-icons">${renderIcon(dockerIcon)}</div>
              <h4>Docker</h4>
              <p>One-line docker run</p>
            </div>
            <div class="device-item">
              <div class="device-icons">${renderIcon(kubernetesIcon)}</div>
              <h4>Kubernetes</h4>
              <p>Helm chart, production-ready</p>
            </div>
            <div class="device-item">
              <div class="device-icons">
                ${renderIcon(sqliteIcon)} ${renderIcon(postgresIcon)}
              </div>
              <h4>SQLite or Postgres</h4>
              <p>Embedded or bring your own</p>
            </div>
            <div class="device-item">
              <div class="device-icons">
                <svg viewBox="0 0 24 24" fill="none" stroke="#a0c4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h4>Local Secrets</h4>
              <p>Encrypted, never leaves your machine</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
