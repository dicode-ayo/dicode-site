import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

import denoIcon from "@iconify-icons/logos/deno.js";
import pythonIcon from "@iconify-icons/logos/python.js";
import dockerIcon from "@iconify-icons/logos/docker-icon.js";
import juliaIcon from "@iconify-icons/logos/julia.js";

import { renderIcon, type IconData } from "../utils/icon.js";

interface Runtime {
  icon?: IconData;
  inlineSvg?: string;
  name: string;
  tagline: string;
  features: string[];
  comingSoon?: boolean;
}

// Podman doesn't exist in @iconify-icons/logos, use inline SVG (official Podman logo)
const PODMAN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <circle cx="64" cy="64" r="60" fill="#892ca0"/>
  <path fill="#fff" d="M64 30c-14.3 0-26 11.7-26 26v22h52V56c0-14.3-11.7-26-26-26zm-13 38V56c0-7.2 5.8-13 13-13s13 5.8 13 13v12H51zm9-18c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm16 0c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z"/>
</svg>`;

const RUNTIMES: Runtime[] = [
  {
    icon: denoIcon,
    name: "Deno",
    tagline: "TypeScript · JavaScript",
    features: [
      "Auto-installed, version-pinnable",
      "Native fetch, import npm:* inline",
      "SDK globals injected automatically",
      "Sandboxed by default",
    ],
  },
  {
    icon: pythonIcon,
    name: "Python",
    tagline: "uv · PEP 723 inline deps",
    features: [
      "Auto-installed via uv",
      "Inline dependency declarations",
      "Async detection (asyncio.run)",
      "SDK globals at module level",
    ],
  },
  {
    icon: dockerIcon,
    name: "Docker",
    tagline: "any language, any image",
    features: [
      "Pull from registry or Dockerfile build",
      "Live log streaming + kill support",
      "Orphan container cleanup",
      "Volume & port config in task.yaml",
    ],
  },
  {
    inlineSvg: PODMAN_SVG,
    name: "Podman",
    tagline: "rootless containers",
    features: [
      "Drop-in Docker replacement",
      "No daemon, no root required",
      "Same task.yaml config as Docker",
      "Better for multi-tenant hosts",
    ],
  },
  {
    icon: juliaIcon,
    name: "Julia",
    tagline: "scientific computing",
    features: [
      "Native performance for numerics",
      "Pkg.jl dependency resolution",
      "Perfect for data pipelines & ML",
      "SDK globals via dicode.jl",
    ],
    comingSoon: true,
  },
];

@customElement("dc-runtimes")
export class DcRuntimes extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-runtimes .runtime-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: var(--space-lg);
        }
        dc-runtimes .runtime-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: var(--space-xl);
          transition: var(--transition);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        dc-runtimes .runtime-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-4px);
          box-shadow: var(--shadow-card);
        }
        dc-runtimes .runtime-card.coming-soon { opacity: .7; }
        dc-runtimes .runtime-card.coming-soon::after {
          content: 'coming soon';
          position: absolute;
          top: var(--space-md);
          right: var(--space-md);
          font-size: var(--text-xs);
          font-weight: var(--font-semibold);
          color: var(--yellow);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
          background: rgba(202, 138, 4, .12);
          border: 1px solid rgba(202, 138, 4, .3);
          padding: 2px var(--space-sm);
          border-radius: var(--radius-pill);
        }
        dc-runtimes .runtime-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        dc-runtimes .runtime-header svg { width: 40px; height: 40px; flex-shrink: 0; }
        dc-runtimes .runtime-title h3 {
          color: var(--heading);
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          margin: 0;
        }
        dc-runtimes .runtime-title p {
          color: var(--muted);
          font-size: var(--text-xs);
          margin: 0;
          font-family: var(--font-mono);
        }
        dc-runtimes .runtime-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }
        dc-runtimes .runtime-features li {
          color: var(--text);
          font-size: var(--text-sm);
          padding-left: 1.2rem;
          position: relative;
          line-height: var(--leading-snug);
        }
        dc-runtimes .runtime-features li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--green);
          font-weight: var(--font-bold);
        }
        @media (max-width: 640px) {
          dc-runtimes .runtime-grid {
            grid-template-columns: 1fr;
            gap: var(--space-md);
          }
          dc-runtimes .runtime-card { padding: var(--space-lg); }
        }
      </style>
      <section id="runtimes" style="background: var(--bg);">
        <div class="container">
          <p class="section-label reveal">Execution Runtimes</p>
          <h2 class="section-title reveal">Run tasks in the language you love</h2>
          <p class="section-sub reveal">
            Five first-class runtimes. Write TypeScript, Python, or run any container.
            Each runtime is auto-installed and version-pinnable per task or per source.
          </p>
          <div class="runtime-grid stagger">
            ${RUNTIMES.map(
              (r) => html`
                <div class="runtime-card ${r.comingSoon ? "coming-soon" : ""}">
                  <div class="runtime-header">
                    ${r.icon
                      ? renderIcon(r.icon)
                      : html`<span
                          style="display:inline-block;width:40px;height:40px;"
                          .innerHTML=${r.inlineSvg ?? ""}
                        ></span>`}
                    <div class="runtime-title">
                      <h3>${r.name}</h3>
                      <p>${r.tagline}</p>
                    </div>
                  </div>
                  <ul class="runtime-features">
                    ${r.features.map((f) => html`<li>${f}</li>`)}
                  </ul>
                </div>
              `,
            )}
          </div>
        </div>
      </section>
    `;
  }
}
