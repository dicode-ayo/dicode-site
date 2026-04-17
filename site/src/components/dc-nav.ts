import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

import githubIcon from "@iconify-icons/logos/github-icon.js";
import { renderIcon } from "../utils/icon.js";

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
    const menu = this.querySelector(".nav-mobile-menu");
    const hamburger = this.querySelector(".nav-hamburger");
    if (!menu || !hamburger) return;
    const isOpen = menu.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  }

  private _closeMenu() {
    const menu = this.querySelector(".nav-mobile-menu");
    const hamburger = this.querySelector(".nav-hamburger");
    if (!menu || !hamburger) return;
    menu.classList.remove("open");
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
        dc-nav .nav-links-desktop {
          display: flex;
          flex-direction: row;
          gap: 1.4rem;
          list-style: none;
          align-items: center;
        }
        dc-nav .nav-links-desktop a {
          color: var(--muted);
          text-decoration: none;
          font-size: .85rem;
          transition: color .2s;
          white-space: nowrap;
        }
        dc-nav .nav-links-desktop a:hover { color: var(--sky); }

        /* Mobile menu overlay — hidden by default, shown via .open class */
        dc-nav .nav-mobile-menu {
          display: none;
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg);
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: var(--space-md);
          padding: var(--space-xl) var(--space-md);
          z-index: var(--z-nav);
          overflow-y: auto;
          border-top: 1px solid var(--border);
        }
        dc-nav .nav-mobile-menu.open { display: flex; }
        dc-nav .nav-mobile-menu a {
          font-size: var(--text-lg);
          color: var(--text);
          text-decoration: none;
          padding: var(--space-md) var(--space-lg);
          width: 100%;
          max-width: 420px;
          text-align: center;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--card-bg);
          transition: background var(--duration-fast) var(--ease),
                      border-color var(--duration-fast) var(--ease),
                      color var(--duration-fast) var(--ease);
        }
        dc-nav .nav-mobile-menu a:hover,
        dc-nav .nav-mobile-menu a:active {
          border-color: var(--sky);
          color: var(--sky);
        }
        dc-nav .nav-github {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          color: var(--text);
          transition: background var(--duration-fast) var(--ease),
                      border-color var(--duration-fast) var(--ease),
                      transform var(--duration-fast) var(--ease);
        }
        dc-nav .nav-github:hover {
          background: var(--card-bg);
          border-color: var(--sky);
          transform: translateY(-1px);
        }
        dc-nav .nav-github svg { width: 18px; height: 18px; display: block; }
        dc-nav .nav-right { display: flex; align-items: center; gap: var(--space-sm); }
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
          dc-nav .nav-links-desktop { display: none; }
        }
        @media (max-width: 640px) { dc-nav nav { padding: 0 1rem; } }
      </style>
      <nav>
        <a class="nav-logo" href="/">&#9889; <span>di</span>code</a>
        <div class="nav-links nav-links-desktop">
          <a href="/docs/getting-started/">Docs</a>
          <a href="#ai-loop">How it works</a>
          <a href="#mcp-factory">MCP</a>
          <a href="#download">Download</a>
          <a href="#deploy">Pricing</a>
        </div>
        <div class="nav-right">
          <dc-theme-toggle></dc-theme-toggle>
          <a
            class="nav-github"
            href="https://github.com/dicode-ayo/dicode-core"
            target="_blank"
            rel="noopener"
            aria-label="View on GitHub"
            title="View on GitHub"
          >
            ${renderIcon(githubIcon, { adaptive: true })}
          </a>
        </div>
        <button class="nav-hamburger" aria-label="Toggle menu" @click=${() => this._toggleMenu()}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>
      <!-- Mobile menu overlay — sibling of <nav>, not child, to escape
           the fixed-nav's containing block created by backdrop-filter. -->
      <div class="nav-mobile-menu">
        <a href="/docs/getting-started/" @click=${() => this._closeMenu()}>Docs</a>
        <a href="#ai-loop" @click=${() => this._closeMenu()}>How it works</a>
        <a href="#mcp-factory" @click=${() => this._closeMenu()}>MCP</a>
        <a href="#download" @click=${() => this._closeMenu()}>Download</a>
        <a href="#deploy" @click=${() => this._closeMenu()}>Pricing</a>
      </div>
    `;
  }
}
