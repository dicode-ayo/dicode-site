import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

import appleIcon from "@iconify-icons/logos/apple.js";
import linuxIcon from "@iconify-icons/logos/linux-tux.js";
import windowsIcon from "@iconify-icons/logos/microsoft-windows-icon.js";
import dockerIcon from "@iconify-icons/logos/docker-icon.js";
import githubIcon from "@iconify-icons/logos/github-icon.js";

import { renderIcon, type IconData } from "../utils/icon.js";

const REPO = "https://github.com/dicode-ayo/dicode-core";
const RELEASES = `${REPO}/releases/latest`;
const ACTIONS = `${REPO}/actions/workflows/release.yml`;

interface DownloadTarget {
  icon: IconData;
  title: string;
  subtitle: string;
  platform: string;
  artifact: string;
  cmd?: string;
}

const TARGETS: DownloadTarget[] = [
  {
    icon: linuxIcon,
    title: "Linux",
    subtitle: "amd64 · arm64",
    platform: "linux",
    artifact: "dicode-linux-amd64",
    cmd: "curl -Lo dicode https://github.com/dicode-ayo/dicode-core/releases/latest/download/dicode-linux-amd64 && chmod +x dicode",
  },
  {
    icon: appleIcon,
    title: "macOS",
    subtitle: "Apple Silicon · Intel",
    platform: "darwin",
    artifact: "dicode-darwin-amd64",
    cmd: "curl -Lo dicode https://github.com/dicode-ayo/dicode-core/releases/latest/download/dicode-darwin-amd64 && chmod +x dicode",
  },
  {
    icon: windowsIcon,
    title: "Windows",
    subtitle: "amd64",
    platform: "windows",
    artifact: "dicode-windows-amd64",
    cmd: "Download dicode-windows-amd64.exe from the releases page",
  },
  {
    icon: dockerIcon,
    title: "Docker",
    subtitle: "all platforms",
    platform: "docker",
    artifact: "ghcr.io/dicode-ayo/dicode",
    cmd: "docker run -p 8080:8080 ghcr.io/dicode-ayo/dicode:latest",
  },
];

@customElement("dc-download")
export class DcDownload extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-download .download-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.2rem;
          margin-top: 2rem;
          margin-bottom: 2rem;
        }
        dc-download .download-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.6rem 1.4rem;
          transition: border-color .25s, transform .2s, box-shadow .25s;
          display: flex;
          flex-direction: column;
          gap: .8rem;
        }
        dc-download .download-card:hover {
          border-color: rgba(160, 196, 255, .35);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, .35);
        }
        dc-download .download-header {
          display: flex; align-items: center; gap: .8rem;
        }
        dc-download .download-header svg { width: 36px; height: 36px; flex-shrink: 0; }
        dc-download .download-title h4 {
          color: var(--heading); font-size: 1rem; font-weight: 700; margin: 0;
        }
        dc-download .download-title p {
          color: var(--muted); font-size: .75rem; margin: 0;
        }
        dc-download .download-cmd {
          background: var(--code-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: .6rem .8rem;
          font-family: 'Fira Code', 'Cascadia Code', monospace;
          font-size: .72rem;
          color: var(--lavender);
          overflow-x: auto;
          white-space: nowrap;
          margin: 0;
        }
        dc-download .download-link {
          color: var(--sky);
          font-size: .82rem;
          font-weight: 600;
          text-decoration: none;
          margin-top: auto;
        }
        dc-download .download-link:hover { color: var(--blue2); }
        dc-download .download-link::after { content: ' →'; }
        dc-download .download-cta {
          display: flex; align-items: center; justify-content: center;
          gap: 1rem; flex-wrap: wrap; margin-top: 2rem;
        }
        dc-download .download-cta-note {
          text-align: center; color: var(--muted); font-size: .85rem;
          margin-top: 1rem;
        }
        dc-download .download-cta-note a { color: var(--sky); text-decoration: none; }
        dc-download .download-cta-note a:hover { text-decoration: underline; }
        dc-download .cta-icon { width: 18px; height: 18px; }
        @media (max-width: 640px) {
          dc-download .download-grid { grid-template-columns: 1fr; gap: 1rem; }
          dc-download .download-cmd { font-size: .65rem; padding: .5rem .6rem; }
        }
      </style>
      <section id="download" style="background: var(--bg);">
        <div class="container">
          <p class="section-label reveal">Download</p>
          <h2 class="section-title reveal">Get dicode in seconds</h2>
          <p class="section-sub reveal">
            Single binary. No installer, no dependencies, no background services.
            Download for your platform and run it.
          </p>
          <div class="download-grid stagger">
            ${TARGETS.map(
              (t) => html`
                <div class="download-card">
                  <div class="download-header">
                    ${renderIcon(t.icon)}
                    <div class="download-title">
                      <h4>${t.title}</h4>
                      <p>${t.subtitle}</p>
                    </div>
                  </div>
                  ${t.cmd ? html`<pre class="download-cmd">${t.cmd}</pre>` : ""}
                  <a
                    class="download-link"
                    href="${RELEASES}"
                    target="_blank"
                    rel="noopener"
                  >
                    Download ${t.artifact}
                  </a>
                </div>
              `,
            )}
          </div>
          <div class="download-cta reveal">
            <a class="btn-primary" href="${RELEASES}" target="_blank" rel="noopener">
              ${renderIcon(githubIcon, "cta-icon")} All releases
            </a>
            <a class="btn-ghost" href="${ACTIONS}" target="_blank" rel="noopener">
              Latest CI builds
            </a>
          </div>
          <p class="download-cta-note reveal">
            Building from source? Clone
            <a href="${REPO}" target="_blank" rel="noopener">dicode-ayo/dicode-core</a>
            and run <code style="color: var(--sky);">make build</code>.
          </p>
        </div>
      </section>
    `;
  }
}
