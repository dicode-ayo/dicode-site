import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-nav")
export class DcNav extends LitElement {
  private _scrollHandler = this._onScroll.bind(this);

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("scroll", this._scrollHandler, { passive: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("scroll", this._scrollHandler);
  }

  private _onScroll() {
    const nav = this.querySelector("nav");
    if (!nav) return;
    if (window.scrollY > 40) {
      nav.style.background = "var(--nav-bg-scrolled)";
    } else {
      nav.style.background = "var(--nav-bg)";
    }
  }

  private _toggleMenu() {
    const links = this.querySelector(".nav-links");
    const hamburger = this.querySelector(".nav-hamburger");
    if (!links || !hamburger) return;
    const isOpen = links.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  }

  private _closeMenu() {
    const links = this.querySelector(".nav-links");
    const hamburger = this.querySelector(".nav-hamburger");
    if (!links || !hamburger) return;
    links.classList.remove("open");
    hamburger.classList.remove("open");
    document.body.style.overflow = "";
  }

  render() {
    return html`
      <style>
        dc-nav nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2rem; height: 60px;
          background: var(--nav-bg); backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border); transition: background .3s;
        }
        dc-nav .nav-logo { font-size: 1.2rem; font-weight: 700; color: var(--heading); text-decoration: none; display: flex; align-items: center; gap: .5rem; }
        dc-nav .nav-logo span { color: var(--blue); }
        dc-nav .nav-links { display: flex; gap: 1.4rem; list-style: none; }
        dc-nav .nav-links a { color: var(--muted); text-decoration: none; font-size: .85rem; transition: color .2s; white-space: nowrap; }
        dc-nav .nav-links a:hover { color: var(--sky); }
        dc-nav .nav-cta {
          background: var(--blue); color: #fff; padding: .45rem 1.2rem;
          border-radius: 8px; text-decoration: none; font-size: .875rem; font-weight: 600;
          transition: background .2s, transform .15s;
        }
        dc-nav .nav-cta:hover { background: var(--blue2); transform: translateY(-1px); }
        dc-nav .nav-right { display: flex; align-items: center; gap: .8rem; }
        dc-nav .nav-hamburger {
          display: none; background: none; border: none; cursor: pointer;
          flex-direction: column; gap: 5px; padding: 4px; z-index: 110;
        }
        dc-nav .nav-hamburger span {
          display: block; width: 22px; height: 2px; background: var(--text);
          border-radius: 2px; transition: transform .3s, opacity .3s;
        }
        dc-nav .nav-hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        dc-nav .nav-hamburger.open span:nth-child(2) { opacity: 0; }
        dc-nav .nav-hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
        @media (max-width: 900px) {
          dc-nav .nav-hamburger { display: flex; }
          dc-nav .nav-cta-desktop { display: none; }
          dc-nav .nav-links {
            display: none; position: fixed; top: 60px; left: 0; right: 0; bottom: 0;
            background: var(--nav-bg-scrolled); backdrop-filter: blur(20px);
            flex-direction: column; align-items: center; justify-content: center;
            gap: 2rem; padding: 2rem; z-index: 100;
          }
          dc-nav .nav-links.open { display: flex; }
          dc-nav .nav-links a { font-size: 1.2rem; color: var(--text); }
        }
        @media (max-width: 640px) { dc-nav nav { padding: 0 1rem; } }
      </style>
      <nav>
        <a class="nav-logo" href="/">&#9889; <span>di</span>code</a>
        <div class="nav-links">
          <a href="/dicode-site/docs/" @click=${() => this._closeMenu()}>Docs</a>
          <a href="#how" @click=${() => this._closeMenu()}>How it works</a>
          <a href="#gitops" @click=${() => this._closeMenu()}>GitOps</a>
          <a href="#code" @click=${() => this._closeMenu()}>Code</a>
          <a href="#download" @click=${() => this._closeMenu()}>Download</a>
          <a href="#deploy" @click=${() => this._closeMenu()}>Pricing</a>
          <a href="#opensource" @click=${() => this._closeMenu()}>GitHub</a>
        </div>
        <div class="nav-right">
          <dc-theme-toggle></dc-theme-toggle>
          <a class="nav-cta nav-cta-desktop" href="https://github.com/dicode-ayo/dicode-core" target="_blank" rel="noopener">View on GitHub &rarr;</a>
        </div>
        <button class="nav-hamburger" aria-label="Toggle menu" @click=${() => this._toggleMenu()}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>
    `;
  }
}
