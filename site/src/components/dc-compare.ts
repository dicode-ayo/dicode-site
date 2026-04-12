import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-compare")
export class DcCompare extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-compare table { width: 100%; border-collapse: collapse; font-size: .85rem; min-width: 700px; }
        dc-compare th { text-align: center; padding: .8rem; color: var(--muted); font-weight: 600; }
        dc-compare th:first-child { text-align: left; }
        dc-compare th.dicode-col { color: var(--sky); font-weight: 700; }
        dc-compare thead tr { border-bottom: 2px solid var(--border); }
        dc-compare tbody tr { border-bottom: 1px solid var(--border); }
        dc-compare tbody tr:last-child { border-bottom: none; }
        dc-compare td { padding: .6rem .8rem; color: var(--text); }
        dc-compare td:not(:first-child) { text-align: center; }
        dc-compare .check { color: var(--green); }
        dc-compare .dash { color: var(--muted); }
        dc-compare .partial { color: var(--yellow); }
        @media (max-width: 640px) {
          dc-compare table { font-size: .75rem; }
          dc-compare th, dc-compare td { padding: .5rem .4rem; }
        }
      </style>
      <section id="compare" style="background: var(--bg);">
        <div class="container">
          <p class="section-label reveal">Comparison</p>
          <h2 class="section-title reveal">How dicode compares</h2>
          <p class="section-sub reveal">Honest feature comparison with the tools you might already know.</p>
          <div class="reveal" style="overflow-x: auto;">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th class="dicode-col">dicode</th>
                  <th>Zapier</th>
                  <th>n8n</th>
                  <th>Windmill</th>
                  <th>Airflow</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Single binary, no infra</td>
                  <td class="check">&check;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                </tr>
                <tr>
                  <td>Git as source of truth</td>
                  <td class="check">&check;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                  <td class="partial">partial</td>
                  <td class="dash">&mdash;</td>
                </tr>
                <tr>
                  <td>Auto-sync from git</td>
                  <td class="check">&check;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                  <td class="partial">manual</td>
                  <td class="dash">&mdash;</td>
                </tr>
                <tr>
                  <td>AI task generation</td>
                  <td class="check">&check;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                  <td class="check">&check;</td>
                  <td class="dash">&mdash;</td>
                </tr>
                <tr>
                  <td>MCP server for AI agents</td>
                  <td class="check">&check;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                </tr>
                <tr>
                  <td>Webhook relay (no ngrok)</td>
                  <td class="check">&check;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                </tr>
                <tr>
                  <td>Desktop tray app</td>
                  <td class="check">&check;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                </tr>
                <tr>
                  <td>Code you own &amp; review</td>
                  <td class="check">&check;</td>
                  <td class="dash">&mdash;</td>
                  <td class="partial">partial</td>
                  <td class="check">&check;</td>
                  <td class="check">&check;</td>
                </tr>
                <tr>
                  <td>Zero-setup OAuth (14+)</td>
                  <td class="check">&check;</td>
                  <td class="check">&check;</td>
                  <td class="check">&check;</td>
                  <td class="dash">&mdash;</td>
                  <td class="dash">&mdash;</td>
                </tr>
                <tr>
                  <td>Free self-hosted (all features)</td>
                  <td class="check">&check;</td>
                  <td class="dash">&mdash;</td>
                  <td class="check">&check;</td>
                  <td class="check">&check;</td>
                  <td class="check">&check;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }
}
