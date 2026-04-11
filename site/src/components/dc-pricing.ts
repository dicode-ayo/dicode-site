import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-pricing")
export class DcPricing extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-pricing .deploy-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 2rem; }
        dc-pricing .deploy-card {
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 2rem;
          transition: transform .25s, box-shadow .25s;
          position: relative;
        }
        dc-pricing .deploy-card.featured {
          border-color: rgba(13,110,253,.5);
          box-shadow: 0 0 0 1px rgba(13,110,253,.3), 0 16px 48px rgba(13,110,253,.15);
        }
        dc-pricing .featured-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: var(--blue); color: #fff; font-size: .72rem; font-weight: 700;
          letter-spacing: .05em; text-transform: uppercase; padding: .25rem .75rem; border-radius: 100px;
          white-space: nowrap;
        }
        dc-pricing .deploy-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,.4); }
        dc-pricing .deploy-icon { font-size: 2rem; margin-bottom: 1rem; }
        dc-pricing .deploy-card h3 { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: .4rem; }
        dc-pricing .deploy-card .price { font-size: 1.6rem; font-weight: 800; color: var(--sky); margin: .75rem 0; }
        dc-pricing .deploy-card .price span { font-size: .9rem; font-weight: 400; color: var(--muted); }
        dc-pricing .deploy-card ul { list-style: none; margin-top: 1rem; }
        dc-pricing .deploy-card li {
          color: var(--muted); font-size: .875rem; padding: .35rem 0;
          border-bottom: 1px solid rgba(255,255,255,.05);
          display: flex; gap: .5rem; align-items: flex-start;
        }
        dc-pricing .deploy-card li::before { content: '\u2713'; color: var(--green); flex-shrink: 0; margin-top: 1px; }
        @media (max-width: 768px) {
          dc-pricing .deploy-cards { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          dc-pricing .deploy-cards { grid-template-columns: 1fr; gap: 1.2rem; }
          dc-pricing .deploy-card { padding: 1.5rem; }
          dc-pricing .featured-badge { font-size: .65rem; }
        }
      </style>
      <section id="deploy" style="background: var(--navy2);">
        <div class="container">
          <p class="section-label reveal">Deployment</p>
          <h2 class="section-title reveal">From laptop to enterprise</h2>
          <p class="section-sub reveal">One binary, three ways to run it. Always free to self-host.</p>
          <div class="deploy-cards stagger">
            <div class="deploy-card">
              <div class="deploy-icon">&#x1F5A5;&#xFE0F;</div>
              <h3>Self-Hosted</h3>
              <div class="price">Free</div>
              <ul>
                <li>Full engine — no feature gates</li>
                <li>All 4 runtimes included</li>
                <li>Webhook relay (self-hosted)</li>
                <li>BYO OAuth apps</li>
                <li>Local SQLite database</li>
                <li>System tray + web dashboard</li>
              </ul>
            </div>
            <div class="deploy-card featured">
              <div class="featured-badge">Recommended</div>
              <div class="deploy-icon">&#x2601;&#xFE0F;</div>
              <h3>dicode.app Pro</h3>
              <div class="price">$12<span>/mo</span></div>
              <ul>
                <li>Unlimited webhook relay</li>
                <li style="color: var(--sky); font-weight: 600;">&#x1F511; Zero-setup OAuth (14 providers)</li>
                <li>GitHub, Slack, Google, Spotify, Linear, Discord, GitLab, Notion, Stripe &amp; more</li>
                <li>Private git repos</li>
                <li>Custom relay domain</li>
                <li>Priority support</li>
              </ul>
            </div>
            <div class="deploy-card">
              <div class="deploy-icon">&#x1F3E2;</div>
              <h3>Team / Enterprise</h3>
              <div class="price">$20<span>/seat/mo</span></div>
              <ul>
                <li>Everything in Pro</li>
                <li>Multi-user RBAC</li>
                <li>SSO / SAML</li>
                <li>Audit logs</li>
                <li>Managed Postgres/MySQL</li>
                <li>SLA &amp; dedicated support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
