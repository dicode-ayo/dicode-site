import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

import { getCurrentTheme, toggleTheme, type Theme } from "../utils/theme.js";

@customElement("dc-theme-toggle")
export class DcThemeToggle extends LitElement {
  @state() private theme: Theme = "dark";

  protected createRenderRoot() {
    return this;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.theme = getCurrentTheme();
    window.addEventListener(
      "dicode-theme-change",
      this._onThemeChange as EventListener,
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(
      "dicode-theme-change",
      this._onThemeChange as EventListener,
    );
  }

  private _onThemeChange = (e: CustomEvent<Theme>) => {
    this.theme = e.detail;
  };

  private _handleClick = () => {
    toggleTheme();
  };

  render() {
    const isDark = this.theme === "dark";
    const label = isDark ? "Switch to light mode" : "Switch to dark mode";
    return html`
      <style>
        dc-theme-toggle button {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background .2s, border-color .2s, color .2s;
          padding: 0;
        }
        dc-theme-toggle button:hover {
          background: var(--card-bg);
          border-color: var(--sky);
          color: var(--sky);
        }
        dc-theme-toggle svg {
          width: 18px;
          height: 18px;
        }
      </style>
      <button
        type="button"
        aria-label=${label}
        title=${label}
        @click=${this._handleClick}
      >
        ${isDark
          ? html`
              <!-- Sun icon (click to switch to light) -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            `
          : html`
              <!-- Moon icon (click to switch to dark) -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            `}
      </button>
    `;
  }
}
