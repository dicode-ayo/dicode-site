import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

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
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        dc-connect .provider-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .5rem;
          padding: 1.5rem 1rem;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          transition: transform .2s, border-color .2s;
        }
        dc-connect .provider-item:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,.2);
        }
        dc-connect .provider-logo {
          width: 40px;
          height: 40px;
        }
        dc-connect .provider-name {
          color: #fff;
          font-size: .85rem;
          font-weight: 500;
          text-align: center;
        }
        dc-connect .provider-item.coming-soon {
          opacity: .4;
        }
        dc-connect .provider-item.coming-soon .provider-name::after {
          content: " (soon)";
          font-size: .7rem;
          color: var(--muted);
        }
        dc-connect .provider-item.special {
          border-style: dashed;
          border-color: var(--sky);
          opacity: .7;
        }
        @media (max-width: 768px) {
          dc-connect .provider-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 1rem;
          }
        }
      </style>
      <section id="connect" style="background: var(--navy);">
        <div class="container">
          <p class="section-label reveal">Connect Everything</p>
          <h2 class="section-title reveal">OAuth to every major SaaS</h2>
          <p class="section-sub reveal">OAuth connectors to major SaaS products — built in. Use the relay's broker for zero-setup, or write your own OAuth flow from scratch. More providers added regularly.</p>
          <div class="provider-grid stagger">
            <!-- Available now -->
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              <div class="provider-name">GitHub</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24"><rect x="1" y="5" width="8" height="8" rx="2" fill="#36C5F0"/><rect x="15" y="5" width="8" height="8" rx="2" fill="#2EB67D"/><rect x="1" y="11" width="8" height="8" rx="2" fill="#ECB22E"/><rect x="15" y="11" width="8" height="8" rx="2" fill="#E01E5A"/><rect x="8" y="1" width="8" height="8" rx="2" fill="#36C5F0"/><rect x="8" y="15" width="8" height="8" rx="2" fill="#E01E5A"/></svg>
              <div class="provider-name">Slack</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <div class="provider-name">Google</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>
              <div class="provider-name">Discord</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#FC6D26"><path d="M4.845.904c-.435 0-.82.28-.955.692C2.639 5.449 1.246 9.728.07 13.335a1.437 1.437 0 00.522 1.607l11.071 8.045c.2.145.472.144.67-.004l11.073-8.04a1.436 1.436 0 00.522-1.61c-1.285-3.942-2.683-8.256-3.817-11.746a1.004 1.004 0 00-.957-.684.987.987 0 00-.949.69l-2.405 7.408H8.203l-2.41-7.408a.987.987 0 00-.942-.69h-.006z"/></svg>
              <div class="provider-name">GitLab</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              <div class="provider-name">Spotify</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#5E6AD2"><path d="M3 3h18v18H3V3zm1.2 1.2v15.6h15.6V4.2H4.2zm3.3 4.5h9v1.8h-9V8.7zm0 3.6h6v1.8h-6v-1.8z"/></svg>
              <div class="provider-name">Linear</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#fff"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.29 2.27c-.42-.326-.98-.7-2.055-.607L3.01 2.721c-.466.046-.56.28-.374.466l1.823 1.021zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933l3.222-.186z"/></svg>
              <div class="provider-name">Notion</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#635BFF"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-7.076-2.19l-.893 5.575C4.746 22.724 7.772 24 11.97 24c2.6 0 4.507-.635 5.885-1.856C19.33 20.69 20.2 18.823 20.2 16.554c0-4.132-2.753-5.894-6.224-7.404z"/></svg>
              <div class="provider-name">Stripe</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#00A1E0"><path d="M12 0C5.373 0 0 5.394 0 12.044c0 2.737.907 5.273 2.437 7.31L.394 23.896l4.63-2.015A11.862 11.862 0 0012 24.088C18.627 24.088 24 18.694 24 12.044 24 5.394 18.627 0 12 0zm-.622 4.287h1.244c3.494 0 6.336 2.85 6.336 6.355 0 3.506-2.842 6.355-6.336 6.355H11.378c-3.494 0-6.336-2.849-6.336-6.355 0-3.505 2.842-6.355 6.336-6.355z"/></svg>
              <div class="provider-name">Salesforce</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#D83B01"><path d="M11.255 2.004A4.166 4.166 0 007.6 4.156L2.87 8.08A3.478 3.478 0 001 10.96v2.084a3.478 3.478 0 001.87 2.878l4.73 3.922a4.166 4.166 0 003.655 2.152h1.49a4.166 4.166 0 003.655-2.152l4.73-3.922A3.478 3.478 0 0023 13.044v-2.084a3.478 3.478 0 00-1.87-2.878L16.4 4.16a4.166 4.166 0 00-3.655-2.152h-1.49zm0 2h1.49c.746 0 1.44.395 1.827 1.038l.18.312H9.248l.18-.312a2.166 2.166 0 011.827-1.038z"/></svg>
              <div class="provider-name">Office 365</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#0078D4"><path d="M12 0L1.75 6v12L12 24l10.25-6V6L12 0zm0 2.16l8.25 4.84v9.6L12 21.84l-8.25-5.24V7z"/></svg>
              <div class="provider-name">Azure AD</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#18BFFF"><path d="M14 0H2a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2zM2 22a2 2 0 01-2-2v-4h6v4a2 2 0 01-2 2H2zm20-2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4h6v4zm0-6H0v-2h24v2zm0-4h-8V0h6a2 2 0 012 2v8z"/></svg>
              <div class="provider-name">Airtable</div>
            </div>
            <div class="provider-item">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#0052CC"><path d="M.387 4.166C.1 3.796.07 3.315.323 2.913.576 2.51 1.04 2.31 1.5 2.36l9.965 1.08c.23.025.44.137.582.312l2.494 3.065-1.552 1.262L.387 4.166zm23.226 15.668c.287.37.317.852.064 1.254-.253.403-.717.603-1.177.553l-9.965-1.08a.888.888 0 01-.582-.312l-2.494-3.065 1.552-1.262 12.602 3.912zM14.29 7.958l-2.16-2.655L.388 4.166l10.03 7.743 3.873-3.951zm-4.58 8.084l2.16 2.655 11.743 1.137-10.03-7.743-3.873 3.951z"/></svg>
              <div class="provider-name">Confluence</div>
            </div>
            <!-- Coming soon -->
            <div class="provider-item coming-soon">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              <div class="provider-name">LinkedIn</div>
            </div>
            <div class="provider-item coming-soon">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <div class="provider-name">WhatsApp</div>
            </div>
            <div class="provider-item coming-soon">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#4A154B"><path d="M6.527 2C4.032 2 2 4.032 2 6.527v10.946C2 19.968 4.032 22 6.527 22h10.946C19.968 22 22 19.968 22 17.473V6.527C22 4.032 19.968 2 17.473 2H6.527zm.51 3.467h1.982c.202 0 .378.137.432.332l1.225 4.466a.454.454 0 01-.032.334l-.777 1.6a.454.454 0 00.042.467l2.104 2.822a.454.454 0 00.727-.005l2.065-2.837a.454.454 0 00.04-.461l-.79-1.612a.454.454 0 01-.03-.33l1.24-4.444a.454.454 0 01.432-.332h1.973a.454.454 0 01.44.563l-2.168 8.848a.454.454 0 01-.233.296l-3.4 1.89a.454.454 0 01-.441 0l-3.4-1.89a.454.454 0 01-.233-.296L6.597 6.03a.454.454 0 01.44-.563z"/></svg>
              <div class="provider-name">HubSpot</div>
            </div>
            <div class="provider-item coming-soon">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#FF6C37"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.828.94z"/></svg>
              <div class="provider-name">Telegram</div>
            </div>
            <div class="provider-item coming-soon">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#7B68EE"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
              <div class="provider-name">Jira</div>
            </div>
            <div class="provider-item coming-soon">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#4353FF"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <div class="provider-name">Dropbox</div>
            </div>
            <div class="provider-item coming-soon">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="#EA4AAA"><path d="M12 0C5.37 0 0 5.37 0 12c0 4.23 2.19 7.95 5.49 10.1.03-.87.18-2.01.56-2.88.41-.96 2.64-6.12 2.64-6.12s-.66-1.35-.66-3.33c0-3.12 1.8-5.43 4.05-5.43 1.92 0 2.85 1.44 2.85 3.15 0 1.92-1.23 4.8-1.86 7.47-.54 2.22 1.11 4.05 3.3 4.05 3.96 0 6.63-5.1 6.63-11.13 0-4.59-3.09-8.04-8.7-8.04-6.33 0-10.29 4.72-10.29 9.99 0 1.82.54 3.09 1.38 4.08.15.18.18.33.12.54l-.42 1.71c-.09.3-.27.39-.57.24-2.85-1.44-4.17-5.34-4.17-9.72C.36 5.19 5.67 0 12.72 0 18.42 0 22.5 4.32 22.5 9.45c0 6.09-3.39 10.65-8.37 10.65-1.68 0-3.24-.9-3.78-1.92l-1.05 4.14c-.36 1.35-1.05 2.7-1.68 3.75C9.18 26.58 10.56 27 12 27c6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg>
              <div class="provider-name">Pinterest</div>
            </div>
            <!-- Build your own -->
            <div class="provider-item special">
              <svg class="provider-logo" viewBox="0 0 24 24" fill="none" stroke="var(--sky)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <div class="provider-name">Your Own</div>
            </div>
          </div>
          <p class="reveal" style="text-align: center; color: var(--muted); margin-top: 2rem; font-size: .9rem;">
            No app registration needed with dicode.app Pro. Missing a provider? Write your own OAuth flow — dicode gives you the building blocks. Or <a href="/dicode-site/docs/concepts/relay.html#oauth-broker-dicode-app-pro" style="color: var(--sky);">request a new provider</a>.
          </p>
        </div>
      </section>
    `;
  }
}
