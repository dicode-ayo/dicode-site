import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

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
          text-align: center; padding: 100px 2rem;
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
          <a href="https://github.com/dr14/dicode" class="github-btn reveal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            Star on GitHub
          </a>
        </div>
      </section>
    `;
  }
}
