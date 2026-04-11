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
          background: var(--navy); border-top: 1px solid var(--border);
          padding: 2rem; text-align: center;
        }
        dc-footer footer p { color: var(--muted); font-size: .85rem; }
        dc-footer footer a { color: var(--sky); text-decoration: none; }
        dc-footer footer a:hover { text-decoration: underline; }
        @media (max-width: 640px) {
          dc-footer footer p { font-size: .78rem; }
        }
      </style>
      <footer>
        <p>&#9889; dicode — GitOps-native task orchestrator with AI generation &nbsp;&middot;&nbsp;
          <a href="https://github.com/dr14/dicode">GitHub</a> &nbsp;&middot;&nbsp;
          Apache 2.0 License
        </p>
      </footer>
    `;
  }
}
