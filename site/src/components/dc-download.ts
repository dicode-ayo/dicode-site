import { LitElement, html, nothing, type PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";

import appleIcon from "@iconify-icons/logos/apple.js";
import linuxIcon from "@iconify-icons/logos/linux-tux.js";
import windowsIcon from "@iconify-icons/logos/microsoft-windows-icon.js";
import dockerIcon from "@iconify-icons/logos/docker-icon.js";
import githubIcon from "@iconify-icons/logos/github-icon.js";
import helmIcon from "@iconify-icons/logos/helm.js";

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
  /** Not a GitHub Release asset — shown as a copyable shell snippet */
  staticCmd?: string;
  /** Companion link rendered next to staticCmd. Default: GHCR package page. */
  staticLinkHref?: string;
  staticLinkLabel?: string;
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
    staticCmd: "docker run -p 8080:8080 ghcr.io/dicode-ayo/dicode-core:latest",
  },
  {
    icon: helmIcon,
    title: "Helm chart",
    subtitle: "Kubernetes",
    assetPatterns: [],
    staticCmd:
      "git clone https://github.com/dicode-ayo/dicode-core && helm install dicode ./dicode-core/deploy/helm/dicode -n dicode --create-namespace",
    staticLinkHref:
      "https://github.com/dicode-ayo/dicode-core/tree/main/deploy/helm/dicode",
    staticLinkLabel: "Chart on GitHub",
  },
];

interface DetectedPlatform {
  /** linux | darwin | windows */
  os: string;
  /** amd64 | arm64 */
  arch: string;
}

interface UserAgentDataLike {
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string }>;
}

/**
 * Detect the user's OS and CPU architecture for the "Your platform" badge.
 *
 * Modern browsers expose `navigator.userAgentData.getHighEntropyValues`
 * (Chromium 90+) which returns the actual architecture. UA-string sniffing
 * cannot tell ARM Mac from Intel Mac (Apple Silicon UA still says Intel)
 * and rarely reveals ARM Linux, so we fall back to per-OS defaults:
 *
 *   - Linux   → amd64 (most common; ARM users will still see the right card visually)
 *   - macOS   → arm64 (Apple Silicon dominates new shipments since 2020)
 *   - Windows → amd64 (ARM Windows is rare in browsers)
 */
async function detectPlatform(): Promise<DetectedPlatform> {
  const uaData = (navigator as unknown as { userAgentData?: UserAgentDataLike })
    .userAgentData;
  if (uaData?.getHighEntropyValues) {
    try {
      const hints = await uaData.getHighEntropyValues(["architecture"]);
      const platform = (uaData.platform || "").toLowerCase();
      const os = platform.includes("win")
        ? "windows"
        : platform.includes("mac")
          ? "darwin"
          : "linux";
      const arch = hints.architecture === "arm" ? "arm64" : "amd64";
      return { os, arch };
    } catch {
      // fall through to UA sniff
    }
  }

  const ua = navigator.userAgent.toLowerCase();
  const os = ua.includes("win")
    ? "windows"
    : ua.includes("mac")
      ? "darwin"
      : "linux";
  let arch = "amd64";
  if (ua.includes("aarch64") || ua.includes("arm64")) arch = "arm64";
  else if (os === "darwin") arch = "arm64"; // Apple Silicon assumption
  return { os, arch };
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
  @state() private _detectedOs = "";
  @state() private _detectedArch = "";

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    void this._detect();
    this._fetchRelease();
  }

  private async _detect(): Promise<void> {
    const { os, arch } = await detectPlatform();
    this._detectedOs = os;
    this._detectedArch = arch;
  }

  protected updated(changed: PropertyValues): void {
    super.updated(changed);
    // initScrollReveal() (utils/reveal.ts) sets up the IntersectionObserver
    // once at app boot, scanning .reveal/.stagger elements that exist at
    // that moment. Our grid + version + cta render asynchronously after
    // the GitHub API fetch resolves, so the boot-time observer never sees
    // them and they stay at opacity: 0. Mark them visible directly when
    // we transition out of the loading state — the CSS transition still
    // plays once on add.
    if (changed.has("_loading") && !this._loading) {
      requestAnimationFrame(() => {
        this.querySelectorAll(".reveal, .stagger").forEach((el) => {
          el.classList.add("visible");
        });
      });
    }
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
    if (!this._detectedOs || !this._detectedArch) return false;
    const tag = `${this._detectedOs}-${this._detectedArch}`;
    return target.assetPatterns.includes(tag);
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
          background: var(--dicode-card-bg);
          border: 1px solid var(--dicode-border);
          border-radius: var(--dicode-radius);
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
          background: var(--dicode-blue);
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
          color: var(--dicode-heading); font-size: 1rem; font-weight: 700; margin: 0;
        }
        dc-download .download-title p {
          color: var(--dicode-muted); font-size: .75rem; margin: 0;
        }
        dc-download .download-cmd {
          background: var(--dicode-code-bg);
          border: 1px solid var(--dicode-code-border);
          border-radius: 8px;
          padding: .6rem .8rem;
          font-family: 'Fira Code', 'Cascadia Code', monospace;
          font-size: .72rem;
          color: var(--dicode-code-text);
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
          background: var(--dicode-blue);
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
        dc-download .download-btn:hover { background: var(--dicode-blue2); transform: translateY(-1px); }
        dc-download .download-btn::before { content: '\u2193 '; }
        dc-download .download-meta {
          color: var(--dicode-muted);
          font-size: .7rem;
          margin-top: .2rem;
        }
        dc-download .download-link {
          color: var(--dicode-sky);
          font-size: .82rem;
          font-weight: 600;
          text-decoration: none;
          margin-top: auto;
          word-break: break-word;
        }
        dc-download .download-link:hover { color: var(--dicode-blue2); }
        dc-download .download-link::after { content: ' \u2192'; }
        dc-download .download-cta {
          display: flex; align-items: center; justify-content: center;
          gap: 1rem; flex-wrap: wrap; margin-top: 2rem;
        }
        dc-download .download-cta-note {
          text-align: center; color: var(--dicode-muted); font-size: .85rem;
          margin-top: 1rem;
        }
        dc-download .download-cta-note a { color: var(--dicode-sky); text-decoration: none; }
        dc-download .download-cta-note a:hover { text-decoration: underline; }
        dc-download .cta-icon { width: 18px; height: 18px; filter: invert(1); }
        dc-download .download-version {
          text-align: center;
          color: var(--dicode-muted);
          font-size: .8rem;
          margin-bottom: .5rem;
        }
        dc-download .download-version code {
          color: var(--dicode-sky);
          font-weight: 600;
        }
        dc-download .download-loading {
          text-align: center;
          color: var(--dicode-muted);
          padding: 3rem 0;
          font-size: .9rem;
        }
        @media (max-width: 640px) {
          dc-download .download-grid { grid-template-columns: 1fr; gap: 1rem; }
          dc-download .download-cmd { font-size: .65rem; padding: .5rem .6rem; }
        }
      </style>
      <section id="download" style="background: var(--dicode-bg);">
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
                        <a class="download-link" href="${t.staticLinkHref ??
                          "https://github.com/dicode-ayo/dicode-core/pkgs/container/dicode-core"}" target="_blank" rel="noopener">${t.staticLinkLabel ?? "View on GHCR"}</a>`
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
        and run <code style="color: var(--dicode-sky);">make build</code>.
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
        and run <code style="color: var(--dicode-sky);">make build</code>.
      </p>
    `;
  }
}
