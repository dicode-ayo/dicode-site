import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

import appleIcon from "@iconify-icons/logos/apple.js";
import linuxIcon from "@iconify-icons/logos/linux-tux.js";
import windowsIcon from "@iconify-icons/logos/microsoft-windows-icon.js";
import dockerIcon from "@iconify-icons/logos/docker-icon.js";
import githubIcon from "@iconify-icons/logos/github-icon.js";

import { renderIcon, type IconData } from "../utils/icon.js";

const REPO = "https://github.com/dicode-ayo/dicode-core";
const API = "https://api.github.com/repos/dicode-ayo/dicode-core/releases/latest";
const RELEASES = `${REPO}/releases/latest`;

interface DownloadTarget {
  icon: IconData;
  adaptive?: boolean;
  title: string;
  subtitle: string;
  /** Matches against asset filenames to find the right download URL */
  assetPatterns: string[];
  cmd?: string;
  /** Not a GitHub Release asset — static link */
  staticCmd?: string;
}

interface ResolvedAsset {
  name: string;
  url: string;
  size: number;
}

const TARGETS: DownloadTarget[] = [
  {
    icon: linuxIcon,
    title: "Linux",
    subtitle: "amd64",
    assetPatterns: ["linux-amd64"],
  },
  {
    icon: linuxIcon,
    title: "Linux",
    subtitle: "arm64",
    assetPatterns: ["linux-arm64"],
  },
  {
    icon: appleIcon,
    adaptive: true,
    title: "macOS",
    subtitle: "Apple Silicon",
    assetPatterns: ["darwin-arm64"],
  },
  {
    icon: appleIcon,
    adaptive: true,
    title: "macOS",
    subtitle: "Intel",
    assetPatterns: ["darwin-amd64"],
  },
  {
    icon: windowsIcon,
    title: "Windows",
    subtitle: "amd64",
    assetPatterns: ["windows-amd64"],
  },
  {
    icon: dockerIcon,
    title: "Docker",
    subtitle: "all platforms",
    assetPatterns: [],
    staticCmd: "docker run -p 8080:8080 ghcr.io/dicode-ayo/dicode:latest",
  },
];

function detectPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "darwin";
  return "linux";
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

@customElement("dc-download")
export class DcDownload extends LitElement {
  @state() private _version = "";
  @state() private _assets: ResolvedAsset[] = [];
  @state() private _loading = true;
  @state() private _error = false;
  @state() private _detectedPlatform = "";

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this._detectedPlatform = detectPlatform();
    this._fetchRelease();
  }

  private async _fetchRelease() {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this._version = data.tag_name?.replace(/^v/, "") ?? "";
      this._assets = (data.assets ?? [])
        .filter((a: { name: string }) => !a.name.endsWith("checksums.txt"))
        .map((a: { name: string; browser_download_url: string; size: number }) => ({
          name: a.name,
          url: a.browser_download_url,
          size: a.size,
        }));
    } catch {
      this._error = true;
    } finally {
      this._loading = false;
    }
  }

  private _findAsset(target: DownloadTarget): ResolvedAsset | undefined {
    return this._assets.find((a) =>
      target.assetPatterns.some((p) => a.name.includes(p)),
    );
  }

  private _isDetected(target: DownloadTarget): boolean {
    return target.assetPatterns.some((p) => p.includes(this._detectedPlatform));
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
          min-width: 0;
          overflow: hidden;
          position: relative;
        }
        dc-download .download-card:hover {
          border-color: rgba(160, 196, 255, .35);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, .35);
        }
        dc-download .download-card.detected {
          border-color: rgba(13, 110, 253, .5);
          box-shadow: 0 0 20px rgba(13, 110, 253, .15);
        }
        dc-download .detected-badge {
          position: absolute;
          top: .6rem;
          right: .6rem;
          background: var(--blue);
          color: #fff;
          font-size: .6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .05em;
          padding: .15rem .5rem;
          border-radius: 4px;
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
          border: 1px solid var(--code-border);
          border-radius: 8px;
          padding: .6rem .8rem;
          font-family: 'Fira Code', 'Cascadia Code', monospace;
          font-size: .72rem;
          color: var(--code-text);
          overflow-x: auto;
          white-space: nowrap;
          margin: 0;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          -webkit-overflow-scrolling: touch;
        }
        dc-download .download-btn {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          background: var(--blue);
          color: #fff;
          font-size: .82rem;
          font-weight: 600;
          text-decoration: none;
          padding: .55rem 1rem;
          border-radius: 8px;
          margin-top: auto;
          transition: background .2s, transform .15s;
          width: fit-content;
        }
        dc-download .download-btn:hover { background: var(--blue2); transform: translateY(-1px); }
        dc-download .download-btn::before { content: '\u2193 '; }
        dc-download .download-meta {
          color: var(--muted);
          font-size: .7rem;
          margin-top: .2rem;
        }
        dc-download .download-link {
          color: var(--sky);
          font-size: .82rem;
          font-weight: 600;
          text-decoration: none;
          margin-top: auto;
          word-break: break-word;
        }
        dc-download .download-link:hover { color: var(--blue2); }
        dc-download .download-link::after { content: ' \u2192'; }
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
        dc-download .cta-icon { width: 18px; height: 18px; filter: invert(1); }
        dc-download .download-version {
          text-align: center;
          color: var(--muted);
          font-size: .8rem;
          margin-bottom: .5rem;
        }
        dc-download .download-version code {
          color: var(--sky);
          font-weight: 600;
        }
        dc-download .download-loading {
          text-align: center;
          color: var(--muted);
          padding: 3rem 0;
          font-size: .9rem;
        }
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
          ${this._loading
            ? html`<div class="download-loading">Loading latest release...</div>`
            : this._error
              ? this._renderFallback()
              : this._renderCards()}
        </div>
      </section>
    `;
  }

  private _renderCards() {
    return html`
      ${this._version
        ? html`<p class="download-version reveal">Latest: <code>${this._version}</code></p>`
        : nothing}
      <div class="download-grid stagger">
        ${TARGETS.map((t) => {
          const asset = this._findAsset(t);
          const detected = this._isDetected(t);
          return html`
            <div class="download-card ${detected ? "detected" : ""}">
              ${detected ? html`<span class="detected-badge">Your platform</span>` : nothing}
              <div class="download-header">
                ${renderIcon(t.icon, { adaptive: t.adaptive })}
                <div class="download-title">
                  <h4>${t.title}</h4>
                  <p>${t.subtitle}</p>
                </div>
              </div>
              ${t.staticCmd
                ? html`<pre class="download-cmd">${t.staticCmd}</pre>
                        <a class="download-link" href="https://github.com/dicode-ayo/dicode-core/pkgs/container/dicode" target="_blank" rel="noopener">View on GHCR</a>`
                : asset
                  ? html`<a class="download-btn" href="${asset.url}" rel="noopener">${asset.name}</a>
                         <span class="download-meta">${formatSize(asset.size)}</span>`
                  : html`<a class="download-link" href="${RELEASES}" target="_blank" rel="noopener">View on GitHub</a>`}
            </div>
          `;
        })}
      </div>
      <div class="download-cta reveal">
        <a class="btn-primary" href="${RELEASES}" target="_blank" rel="noopener">
          ${renderIcon(githubIcon, "cta-icon")} All releases
        </a>
      </div>
      <p class="download-cta-note reveal">
        Building from source? Clone
        <a href="${REPO}" target="_blank" rel="noopener">dicode-ayo/dicode-core</a>
        and run <code style="color: var(--sky);">make build</code>.
      </p>
    `;
  }

  private _renderFallback() {
    return html`
      <div class="download-cta reveal">
        <a class="btn-primary" href="${RELEASES}" target="_blank" rel="noopener">
          ${renderIcon(githubIcon, "cta-icon")} Download from GitHub
        </a>
      </div>
      <p class="download-cta-note reveal">
        Building from source? Clone
        <a href="${REPO}" target="_blank" rel="noopener">dicode-ayo/dicode-core</a>
        and run <code style="color: var(--sky);">make build</code>.
      </p>
    `;
  }
}
