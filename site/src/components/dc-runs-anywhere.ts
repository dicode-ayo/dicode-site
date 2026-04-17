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

        /* ── Grow paths ── */
        dc-runs-anywhere .grow-section {
          margin-top: 3.5rem;
        }
        dc-runs-anywhere .grow-title {
          text-align: center;
          font-size: .75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: var(--blue);
          margin-bottom: 1.5rem;
        }
        dc-runs-anywhere .grow-paths {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        dc-runs-anywhere .grow-path {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.6rem;
        }
        dc-runs-anywhere .grow-path h4 {
          font-size: .85rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: .5rem;
        }
        dc-runs-anywhere .grow-path h4 span { font-size: 1.2rem; }
        dc-runs-anywhere .grow-steps {
          display: flex;
          align-items: center;
          gap: .4rem;
          flex-wrap: wrap;
        }
        dc-runs-anywhere .grow-step {
          display: flex;
          align-items: center;
          gap: .4rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: .4rem .7rem;
          font-size: .75rem;
          color: var(--text);
          white-space: nowrap;
        }
        dc-runs-anywhere .grow-step.active {
          border-color: var(--blue);
          color: var(--sky);
          font-weight: 600;
        }
        dc-runs-anywhere .grow-step.coming {
          opacity: .5;
          border-style: dashed;
        }
        dc-runs-anywhere .grow-step .gs-icon { font-size: .9rem; }
        dc-runs-anywhere .grow-arrow {
          color: var(--muted);
          font-size: .75rem;
          flex-shrink: 0;
        }
        dc-runs-anywhere .grow-note {
          margin-top: .8rem;
          font-size: .68rem;
          color: var(--muted);
          font-style: italic;
        }

        dc-runs-anywhere .fleet-note {
          text-align: center;
          margin-top: 2.5rem;
          padding: 1.4rem;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }
        dc-runs-anywhere .fleet-note h4 {
          font-size: .85rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: .3rem;
        }
        dc-runs-anywhere .fleet-note p {
          font-size: .8rem;
          color: var(--muted);
          line-height: 1.5;
        }
        dc-runs-anywhere .fleet-note strong { color: var(--sky); }

        @media (max-width: 768px) {
          dc-runs-anywhere .device-grid { grid-template-columns: repeat(3, 1fr); }
          dc-runs-anywhere .grow-paths { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          dc-runs-anywhere .device-grid { grid-template-columns: repeat(2, 1fr); gap: .8rem; }
          dc-runs-anywhere .device-item { padding: 1.2rem .8rem; }
          dc-runs-anywhere .device-icons svg { width: 26px; height: 26px; }
          dc-runs-anywhere .grow-steps { gap: .3rem; }
          dc-runs-anywhere .grow-step { font-size: .68rem; padding: .3rem .5rem; }
        }
        @media (max-width: 380px) {
          dc-runs-anywhere .device-grid { grid-template-columns: 1fr 1fr; }
        }
      </style>
      <section id="runs-anywhere" style="background: var(--bg-alt);">
        <div class="container">
          <p class="section-label reveal">Zero Infrastructure</p>
          <h2 class="section-title reveal">Start simple. Expand when ready.</h2>
          <p class="section-sub reveal">
            Single binary, zero dependencies. Works offline on a Raspberry Pi.
            When you outgrow the defaults, plug in production-grade backends &mdash;
            no migration, just config.
          </p>
          <div class="device-grid stagger">
            <div class="device-item">
              <div class="device-icons">
                ${renderIcon(appleIcon, { adaptive: true })} ${renderIcon(linuxIcon)} ${renderIcon(windowsIcon)}
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
          </div>

          <div class="grow-section reveal">
            <div class="grow-title">Expand when ready</div>
            <div class="grow-paths stagger">
              <div class="grow-path">
                <h4><span>&#x1F5C4;&#xFE0F;</span> Database</h4>
                <div class="grow-steps">
                  <div class="grow-step active">
                    <span class="gs-icon">${renderIcon(sqliteIcon)}</span> SQLite
                  </div>
                  <span class="grow-arrow">&rarr;</span>
                  <div class="grow-step">
                    <span class="gs-icon">${renderIcon(postgresIcon)}</span> PostgreSQL
                  </div>
                </div>
                <p class="grow-note">Start embedded. Move to Postgres when you need multi-node or managed backups.</p>
              </div>

              <div class="grow-path">
                <h4><span>&#x1F510;</span> Secrets</h4>
                <div class="grow-steps">
                  <div class="grow-step active">
                    <span class="gs-icon">&#x1F512;</span> Built-in store
                  </div>
                  <span class="grow-arrow">&rarr;</span>
                  <div class="grow-step">
                    <span class="gs-icon">&#x1F511;</span> Doppler
                  </div>
                  <span class="grow-arrow">&rarr;</span>
                  <div class="grow-step">
                    <span class="gs-icon">&#x1F511;</span> 1Password
                  </div>
                  <span class="grow-arrow">&rarr;</span>
                  <div class="grow-step">
                    <span class="gs-icon">&#x1F3E6;</span> HashiCorp Vault
                  </div>
                </div>
                <p class="grow-note">ChaCha20 encrypted local store built in. Pluggable provider chain for external secret managers.</p>
              </div>
            </div>
          </div>

          <div class="fleet-note reveal">
            <h4>&#x1F4BB; One repo, many machines</h4>
            <p>
              Point multiple dicode daemons at the same git repo. Home server runs monitoring,
              laptop runs dev tasks, VPS handles public webhooks, Pi collects sensor data.
              Git push &mdash; <strong>all update within 30 seconds</strong>.
              No orchestration layer, no service mesh.
            </p>
          </div>
          <p class="reveal" style="text-align:center; margin-top:1.5rem;">
            <a href="/docs/" style="color:var(--sky); text-decoration:none; font-size:.85rem; font-weight:600;">Getting started &rarr;</a>
            &nbsp;&middot;&nbsp;
            <a href="/docs/concepts/sharing" style="color:var(--sky); text-decoration:none; font-size:.85rem; font-weight:600;">Multi-machine &amp; sharing &rarr;</a>
          </p>
        </div>
      </section>
    `;
  }
}
