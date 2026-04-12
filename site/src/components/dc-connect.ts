import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

import githubIcon from "@iconify-icons/logos/github-icon.js";
import slackIcon from "@iconify-icons/logos/slack-icon.js";
import googleIcon from "@iconify-icons/logos/google-icon.js";
import discordIcon from "@iconify-icons/logos/discord-icon.js";
import gitlabIcon from "@iconify-icons/logos/gitlab.js";
import spotifyIcon from "@iconify-icons/logos/spotify-icon.js";
import linearIcon from "@iconify-icons/logos/linear-icon.js";
import notionIcon from "@iconify-icons/logos/notion-icon.js";
import stripeIcon from "@iconify-icons/logos/stripe.js";
import salesforceIcon from "@iconify-icons/logos/salesforce.js";
import microsoftOfficeIcon from "@iconify-icons/logos/microsoft-icon.js";
import microsoftAzureIcon from "@iconify-icons/logos/microsoft-azure.js";
import airtableIcon from "@iconify-icons/logos/airtable.js";
import confluenceIcon from "@iconify-icons/logos/confluence.js";
import linkedinIcon from "@iconify-icons/logos/linkedin-icon.js";
import whatsappIcon from "@iconify-icons/logos/whatsapp-icon.js";
import hubspotIcon from "@iconify-icons/logos/hubspot.js";
import telegramIcon from "@iconify-icons/logos/telegram.js";
import jiraIcon from "@iconify-icons/logos/jira.js";
import dropboxIcon from "@iconify-icons/logos/dropbox.js";
import pinterestIcon from "@iconify-icons/logos/pinterest.js";

import { renderIcon, type IconData } from "../utils/icon.js";

interface Provider {
  name: string;
  icon: IconData;
  comingSoon?: boolean;
  /** Auto-invert in dark mode (for black-fill brand icons) */
  adaptive?: boolean;
}

const AVAILABLE: Provider[] = [
  { name: "GitHub", icon: githubIcon, adaptive: true },
  { name: "Slack", icon: slackIcon },
  { name: "Google", icon: googleIcon },
  { name: "Discord", icon: discordIcon },
  { name: "GitLab", icon: gitlabIcon },
  { name: "Spotify", icon: spotifyIcon },
  { name: "Linear", icon: linearIcon },
  { name: "Notion", icon: notionIcon, adaptive: true },
  { name: "Stripe", icon: stripeIcon },
  { name: "Salesforce", icon: salesforceIcon },
  { name: "Office 365", icon: microsoftOfficeIcon },
  { name: "Azure AD", icon: microsoftAzureIcon },
  { name: "Airtable", icon: airtableIcon },
  { name: "Confluence", icon: confluenceIcon },
];

const COMING_SOON: Provider[] = [
  { name: "LinkedIn", icon: linkedinIcon, comingSoon: true },
  { name: "WhatsApp", icon: whatsappIcon, comingSoon: true },
  { name: "HubSpot", icon: hubspotIcon, comingSoon: true },
  { name: "Telegram", icon: telegramIcon, comingSoon: true },
  { name: "Jira", icon: jiraIcon, comingSoon: true },
  { name: "Dropbox", icon: dropboxIcon, comingSoon: true },
  { name: "Pinterest", icon: pinterestIcon, comingSoon: true },
];

@customElement("dc-connect")
export class DcConnect extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-connect .provider-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
        }
        dc-connect .provider-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .6rem;
          padding: 1.4rem 1rem;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: transform .2s, border-color .2s, background .2s;
          text-align: center;
        }
        dc-connect .provider-item:hover {
          transform: translateY(-4px);
          border-color: rgba(160, 196, 255, .35);
          background: rgba(255, 255, 255, .06);
        }
        dc-connect .provider-logo {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
        }
        dc-connect .provider-name {
          color: var(--heading);
          font-size: .85rem;
          font-weight: 500;
          line-height: 1.2;
        }
        dc-connect .provider-item.coming-soon { opacity: .55; }
        dc-connect .provider-item.coming-soon .provider-name::after {
          content: 'coming soon';
          display: block;
          font-size: .65rem;
          color: var(--yellow);
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: .05em;
          margin-top: .15rem;
        }
        dc-connect .provider-item.special {
          border-style: dashed;
          border-color: rgba(13, 110, 253, .5);
          background: rgba(13, 110, 253, .06);
        }
        dc-connect .provider-item.special .provider-logo {
          color: var(--sky);
        }
        dc-connect .provider-item.special .provider-name {
          color: var(--blue2);
          font-weight: 600;
        }
        dc-connect .connect-footer {
          text-align: center;
          color: var(--muted);
          margin-top: 2rem;
          font-size: .9rem;
        }
        dc-connect .connect-footer a {
          color: var(--sky);
          text-decoration: none;
        }
        dc-connect .connect-footer a:hover { text-decoration: underline; }
        @media (max-width: 768px) {
          dc-connect .provider-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: .8rem;
          }
        }
        @media (max-width: 640px) {
          dc-connect .provider-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: .6rem;
          }
          dc-connect .provider-item { padding: 1rem .5rem; }
          dc-connect .provider-logo { width: 28px; height: 28px; }
          dc-connect .provider-name { font-size: .75rem; }
        }
      </style>
      <section id="connect" style="background: var(--bg);">
        <div class="container">
          <p class="section-label reveal">Connect Everything</p>
          <h2 class="section-title reveal">OAuth to every major SaaS</h2>
          <p class="section-sub reveal">
            OAuth connectors to major SaaS products — built in. Use the relay's broker for zero-setup,
            or write your own OAuth flow from scratch. More providers added regularly.
          </p>
          <div class="provider-grid stagger">
            ${AVAILABLE.map(
              (p) => html`
                <div class="provider-item">
                  ${renderIcon(p.icon, { className: "provider-logo", adaptive: p.adaptive })}
                  <div class="provider-name">${p.name}</div>
                </div>
              `,
            )}
            ${COMING_SOON.map(
              (p) => html`
                <div class="provider-item coming-soon">
                  ${renderIcon(p.icon, { className: "provider-logo", adaptive: p.adaptive })}
                  <div class="provider-name">${p.name}</div>
                </div>
              `,
            )}
            <div class="provider-item special">
              <svg
                class="provider-logo"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <div class="provider-name">Your Own</div>
            </div>
          </div>
          <p class="connect-footer reveal">
            No app registration needed with dicode.app Pro. Missing a provider? Write your own OAuth flow —
            dicode gives you the building blocks. Or
            <a href="/dicode-site/docs/concepts/relay.html#oauth-broker-dicode-app-pro">request a new provider</a>.
          </p>
        </div>
      </section>
    `;
  }
}
