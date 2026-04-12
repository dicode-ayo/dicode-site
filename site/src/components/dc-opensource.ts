import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

import githubIcon from "@iconify-icons/logos/github-icon.js";
import { renderIcon } from "../utils/icon.js";

@customElement("dc-opensource")
export class DcOpensource extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-opensource section {
          background: linear-gradient(135deg, var(--navy2) 0%, var(--navy3) 100%);
          text-align: center;
        }
        dc-opensource h2 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; color: #fff; margin-bottom: 1rem; }
        dc-opensource p { color: var(--muted); max-width: 540px; margin: 0 auto 2.5rem; line-height: 1.7; font-size: 1rem; }
        dc-opensource .github-btn {
          display: inline-flex; align-items: center; gap: .6rem;
          background: #fff; color: #0d0d1a; padding: .8rem 2rem;
          border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 1rem;
          transition: transform .2s, box-shadow .2s;
          box-shadow: 0 4px 20px rgba(0,0,0,.3);
        }
        dc-opensource .github-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.4); }
        dc-opensource .github-btn-icon { width: 20px; height: 20px; }
        @media (max-width: 640px) {
          dc-opensource h2 { font-size: 1.5rem; }
          dc-opensource p { font-size: .9rem; }
          dc-opensource .github-btn { font-size: .9rem; padding: .7rem 1.6rem; }
        }
      </style>
      <section id="opensource">
        <div class="container">
          <h2 class="reveal">Open source at the core</h2>
          <p class="reveal">dicode is Apache 2.0 licensed. The full engine — reconciler, runtimes, scheduler, secrets, notifications — is free forever for self-hosted use. No feature gates, no trial limits, no vendor lock-in.</p>
          <a href="https://github.com/dicode-ayo/dicode-core" class="github-btn reveal">
            ${renderIcon(githubIcon, "github-btn-icon")}
            Star on GitHub
          </a>
        </div>
      </section>
    `;
  }
}
