import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

import githubIcon from "@iconify-icons/logos/github-icon.js";
import { renderIcon } from "../utils/icon.js";

const REPO = "dicode-ayo/dicode-core";
const API = `https://api.github.com/repos/${REPO}`;

@customElement("dc-opensource")
export class DcOpensource extends LitElement {
  @state() private _stars = "";

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this._fetchStars();
  }

  private async _fetchStars() {
    try {
      const res = await fetch(API);
      if (!res.ok) return;
      const data = await res.json();
      const count = data.stargazers_count ?? 0;
      this._stars = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
    } catch {
      // Silently fail — button still works without count
    }
  }

  render() {
    return html`
      <style>
        dc-opensource section {
          background: linear-gradient(135deg, var(--bg-alt) 0%, var(--bg-accent) 100%);
          text-align: center;
        }
        dc-opensource h2 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; color: var(--heading); margin-bottom: 1rem; }
        dc-opensource .os-sub { color: var(--muted); max-width: 540px; margin: 0 auto 1.5rem; line-height: 1.7; font-size: 1rem; }
        dc-opensource .os-links {
          display: flex; align-items: center; justify-content: center;
          gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
        }
        dc-opensource .github-btn {
          display: inline-flex; align-items: center; gap: .6rem;
          background: #fff; color: #0d0d1a; padding: .8rem 2rem;
          border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 1rem;
          transition: transform .2s, box-shadow .2s;
          box-shadow: 0 4px 20px rgba(0,0,0,.3);
        }
        dc-opensource .github-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.4); }
        dc-opensource .github-btn-icon { width: 20px; height: 20px; }
        dc-opensource .star-count {
          background: rgba(13,110,253,.15);
          color: var(--sky);
          font-size: .75rem;
          font-weight: 700;
          padding: .15rem .5rem;
          border-radius: 6px;
          margin-left: .2rem;
        }
        dc-opensource .discord-btn {
          display: inline-flex; align-items: center; gap: .5rem;
          background: transparent; color: var(--sky);
          border: 1px solid var(--border); padding: .8rem 1.6rem;
          border-radius: 10px; font-weight: 600; text-decoration: none; font-size: .95rem;
          transition: border-color .2s, transform .2s;
        }
        dc-opensource .discord-btn:hover { border-color: var(--sky); transform: translateY(-2px); }
        dc-opensource .os-who {
          color: var(--muted);
          font-size: .85rem;
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.6;
        }
        dc-opensource .os-who a { color: var(--sky); text-decoration: none; }
        dc-opensource .os-who a:hover { text-decoration: underline; }
        @media (max-width: 640px) {
          dc-opensource h2 { font-size: 1.5rem; }
          dc-opensource .os-sub { font-size: .9rem; }
          dc-opensource .github-btn { font-size: .9rem; padding: .7rem 1.6rem; }
          dc-opensource .os-links { flex-direction: column; }
        }
      </style>
      <section id="opensource">
        <div class="container">
          <h2 class="reveal">Open source at the core</h2>
          <p class="os-sub reveal">
            Apache 2.0 licensed. The full engine &mdash; reconciler, runtimes, scheduler, secrets,
            notifications &mdash; is free forever. No feature gates, no trial limits, no vendor lock-in.
          </p>
          <div class="os-links reveal">
            <a href="https://github.com/${REPO}" class="github-btn" target="_blank" rel="noopener">
              ${renderIcon(githubIcon, "github-btn-icon")}
              Star on GitHub
              ${this._stars ? html`<span class="star-count">${this._stars} &#9733;</span>` : ""}
            </a>
            <a href="https://discord.gg/dicode" class="discord-btn" target="_blank" rel="noopener">
              &#x1F4AC; Join Discord
            </a>
          </div>
          <p class="os-who reveal">
            Built by <a href="https://github.com/dicode-ayo" target="_blank" rel="noopener">@dicode-ayo</a>.
            Questions? Open an issue or say hi on Discord.
          </p>
        </div>
      </section>
    `;
  }
}
