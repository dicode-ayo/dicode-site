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
        dc-pricing .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-lg);
          max-width: 960px;
          margin: 0 auto;
        }
        dc-pricing .pricing-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: var(--space-xl) var(--space-lg);
          position: relative;
          display: flex;
          flex-direction: column;
        }
        dc-pricing .pricing-card.featured {
          border-color: var(--border-dashed);
          box-shadow: 0 0 0 1px rgba(13,110,253,.3), var(--shadow-card);
        }
        dc-pricing .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-strong);
          transition: transform var(--duration), box-shadow var(--duration);
        }
        dc-pricing .pricing-badge {
          position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
          background: var(--blue); color: #fff; font-size: var(--text-xs); font-weight: var(--font-bold);
          letter-spacing: .05em; text-transform: uppercase; padding: var(--space-xs) .75rem;
          border-radius: var(--radius-pill); white-space: nowrap;
        }
        dc-pricing .pricing-card h3 {
          font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--heading);
          margin-bottom: var(--space-xs); text-align: center;
        }
        dc-pricing .pricing-price {
          font-size: 2rem; font-weight: var(--font-extrabold); color: var(--sky);
          text-align: center; margin: var(--space-sm) 0;
        }
        dc-pricing .pricing-price span {
          font-size: var(--text-base); font-weight: var(--font-normal); color: var(--muted);
        }
        dc-pricing .pricing-desc {
          color: var(--muted); font-size: var(--text-sm); line-height: var(--leading-normal);
          text-align: center; margin-bottom: var(--space-md);
        }
        dc-pricing .pricing-card ul {
          list-style: none;
          margin-top: auto;
        }
        dc-pricing .pricing-card li {
          color: var(--text); font-size: var(--text-sm); padding: .35rem 0;
          border-bottom: 1px solid var(--border);
          display: flex; gap: var(--space-sm); align-items: flex-start;
        }
        dc-pricing .pricing-card li:last-child { border-bottom: none; }
        dc-pricing .pricing-card li::before {
          content: '\u2713'; color: var(--green); flex-shrink: 0; margin-top: 1px;
        }
        dc-pricing .pricing-footer {
          text-align: center; margin-top: var(--space-xl); color: var(--muted);
          font-size: var(--text-sm); line-height: var(--leading-normal);
        }
        dc-pricing .pricing-footer strong { color: var(--heading); }
        @media (max-width: 640px) {
          dc-pricing .pricing-grid { grid-template-columns: 1fr; gap: var(--space-md); }
          dc-pricing .pricing-card { padding: var(--space-lg); }
        }
      </style>
      <section id="deploy" style="background: var(--bg-alt);">
        <div class="container">
          <p class="section-label reveal">Pricing</p>
          <h2 class="section-title reveal">Every feature, self-hosted, free forever</h2>
          <p class="section-sub reveal">
            The full engine is always free. Cloud tiers gate execution volume and seats &mdash;
            never capabilities.
          </p>

          <div class="pricing-grid stagger">
            <div class="pricing-card">
              <h3>Self-Hosted</h3>
              <div class="pricing-price">Free</div>
              <p class="pricing-desc">
                The full engine. No gates.
              </p>
              <ul>
                <li>All features, all runtimes</li>
                <li>AI generation &amp; MCP server</li>
                <li>Web dashboard &amp; tray app</li>
                <li>Webhook relay (self-hosted)</li>
                <li>BYO OAuth &amp; LLM provider</li>
                <li>AGPL-3.0 open source</li>
              </ul>
            </div>

            <div class="pricing-card featured">
              <span class="pricing-badge">Most popular</span>
              <h3>Starter</h3>
              <div class="pricing-price">$19<span>/mo</span></div>
              <p class="pricing-desc">
                For solo devs who want it to just work.
              </p>
              <ul>
                <li>Managed relay (5 endpoints)</li>
                <li>OAuth broker (5 providers)</li>
                <li>10K task executions/mo</li>
                <li>Managed database &amp; backups</li>
                <li>1 user</li>
              </ul>
            </div>

            <div class="pricing-card">
              <h3>Pro</h3>
              <div class="pricing-price">$49<span>/mo</span></div>
              <p class="pricing-desc">
                For power users and small teams.
              </p>
              <ul>
                <li>Unlimited relay endpoints</li>
                <li>All 14 OAuth providers</li>
                <li>100K executions/mo</li>
                <li>5 users</li>
                <li>Custom relay domain</li>
                <li>Priority support</li>
              </ul>
            </div>

            <div class="pricing-card">
              <h3>Team</h3>
              <div class="pricing-price">$149<span>/mo</span></div>
              <p class="pricing-desc">
                For teams that automate seriously.
              </p>
              <ul>
                <li>500K executions/mo</li>
                <li>20 users</li>
                <li>Team collaboration features</li>
                <li>Deployment approvals</li>
                <li>Basic RBAC</li>
                <li>SLA &amp; dedicated support</li>
              </ul>
            </div>
          </div>

          <p class="pricing-footer reveal">
            <strong>Our principle:</strong> cloud tiers gate volume and seats, never features.
            Everything the engine can do is free, self-hosted, forever.
            Need enterprise (SSO/SAML, audit logs, custom infrastructure)? <a href="mailto:hello@dicode.app" style="color:var(--sky); text-decoration:none;">Get in touch</a>.
          </p>
        </div>
      </section>
    `;
  }
}
