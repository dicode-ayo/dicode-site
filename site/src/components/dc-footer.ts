import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-footer")
export class DcFooter extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-footer footer {
          background: var(--dicode-bg); border-top: 1px solid var(--dicode-border);
          padding: 2rem; text-align: center;
        }
        dc-footer footer p { color: var(--dicode-muted); font-size: .85rem; }
        dc-footer footer a { color: var(--dicode-sky); text-decoration: none; }
        dc-footer footer a:hover { text-decoration: underline; }
        @media (max-width: 640px) {
          dc-footer footer p { font-size: .78rem; }
        }
      </style>
      <footer>
        <p>&#9889; dicode — GitOps-native task orchestrator with AI generation &nbsp;&middot;&nbsp;
          <a href="https://github.com/dicode-ayo/dicode-core">GitHub</a> &nbsp;&middot;&nbsp;
          <a href="/docs/">Docs</a> &nbsp;&middot;&nbsp;
          <a href="/theme.html">Design System</a> &nbsp;&middot;&nbsp;
          AGPL-3.0 License
        </p>
      </footer>
    `;
  }
}
