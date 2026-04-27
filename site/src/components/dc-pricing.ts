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
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: var(--space-lg);
          max-width: 760px;
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
          margin: 0 0 var(--space-md) 0;
        }
        dc-pricing .pricing-card li {
          color: var(--text); font-size: var(--text-sm); padding: .35rem 0;
          border-bottom: 1px solid var(--border);
          display: flex; gap: var(--space-sm); align-items: flex-start;
        }
        dc-pricing .pricing-card li:last-child { border-bottom: none; }
        dc-pricing .pricing-card li::before {
          content: '✓'; color: var(--green); flex-shrink: 0; margin-top: 1px;
        }
        dc-pricing .pricing-cta {
          margin-top: auto;
          padding-top: var(--space-md);
          text-align: center;
        }
        dc-pricing .pricing-cta a {
          display: inline-block;
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
            The full engine is always free and open source. A managed cloud tier is
            in development &mdash; join the waitlist below.
          </p>

          <div class="pricing-grid stagger">
            <div class="pricing-card featured">
              <span class="pricing-badge">Available now</span>
              <h3>Self-Hosted</h3>
              <div class="pricing-price">Free<span> forever</span></div>
              <p class="pricing-desc">
                The full engine. No gates. AGPL-3.0.
              </p>
              <ul>
                <li>All features, all runtimes</li>
                <li>AI generation &amp; MCP server</li>
                <li>Web dashboard &amp; tray app</li>
                <li>Webhook relay (self-hosted)</li>
                <li>BYO OAuth &amp; LLM provider</li>
                <li>AGPL-3.0 open source</li>
              </ul>
              <div class="pricing-cta">
                <a class="btn-primary" href="#download">Download free</a>
              </div>
            </div>

            <div class="pricing-card">
              <h3>Cloud (managed)</h3>
              <div class="pricing-price">Coming soon</div>
              <p class="pricing-desc">
                Managed relay + OAuth broker. Join the waitlist to be the first to know.
              </p>
              <ul>
                <li>Managed webhook relay, no DNS setup</li>
                <li>OAuth broker for 14 providers, zero app registration</li>
                <li>Built-in metrics &amp; quotas</li>
                <li>Managed database &amp; backups</li>
                <li>Same engine, zero ops</li>
              </ul>
              <div class="pricing-cta">
                <a class="btn-ghost" href="mailto:hello@dicode.app?subject=Cloud%20waitlist">Join waitlist</a>
              </div>
            </div>
          </div>

          <p class="pricing-footer reveal">
            <strong>Our principle:</strong> self-host the full engine for free, forever.
            The Cloud tier is in development &mdash; sign up above to be the first to know.
            Need enterprise (SSO/SAML, audit logs, custom infrastructure)? <a href="mailto:hello@dicode.app" style="color:var(--sky); text-decoration:none;">Get in touch</a>.
          </p>
        </div>
      </section>
    `;
  }
}
