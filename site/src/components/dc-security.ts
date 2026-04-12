import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-security")
export class DcSecurity extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-security .security-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-2xl);
          align-items: start;
        }
        dc-security .security-intro h2 {
          font-size: var(--text-3xl);
          font-weight: var(--font-extrabold);
          color: var(--heading);
          letter-spacing: var(--tracking-tight);
          margin-bottom: var(--space-md);
        }
        dc-security .security-intro p {
          color: var(--muted);
          font-size: var(--text-md);
          line-height: var(--leading-relaxed);
          margin-bottom: var(--space-md);
        }
        dc-security .security-permissions {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        dc-security .permission-item {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: var(--space-md) var(--space-lg);
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          transition: var(--transition);
        }
        dc-security .permission-item:hover {
          border-color: var(--border-strong);
          transform: translateX(4px);
        }
        dc-security .permission-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: var(--blue-tint);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sky);
        }
        dc-security .permission-icon svg {
          width: 20px;
          height: 20px;
        }
        dc-security .permission-body h4 {
          color: var(--heading);
          font-size: var(--text-md);
          font-weight: var(--font-bold);
          margin: 0 0 var(--space-xs);
        }
        dc-security .permission-body p {
          color: var(--muted);
          font-size: var(--text-sm);
          line-height: var(--leading-snug);
          margin: 0;
        }
        dc-security .permission-body code {
          color: var(--sky);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          background: var(--blue-tint);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }
        @media (max-width: 900px) {
          dc-security .security-grid {
            grid-template-columns: 1fr;
            gap: var(--space-xl);
          }
        }
        @media (max-width: 640px) {
          dc-security .permission-item { padding: var(--space-md); }
          dc-security .permission-icon { width: 36px; height: 36px; }
        }
      </style>
      <section id="security" style="background: var(--bg-alt);">
        <div class="container">
          <p class="section-label reveal">Security & Permissions</p>
          <h2 class="section-title reveal">You decide what tasks can do</h2>
          <p class="section-sub reveal">
            Every task declares exactly which files, networks, env vars, and dicode APIs it
            can access — in <code style="color:var(--sky)">task.yaml</code>. Nothing else
            is visible. Review permissions in git, not at runtime.
          </p>

          <div class="security-grid stagger">
            <div class="security-intro">
              <h2>Zero ambient access</h2>
              <p>
                Tasks run in a sandbox with zero default permissions. Want to read a file?
                Declare the path. Call an external API? Declare the host. Use a secret?
                Declare the env var. Every capability is explicit, reviewable in git, and
                auditable per run.
              </p>
              <p>
                The task script never sees anything it didn't ask for. An undeclared env
                var returns <code style="color:var(--sky)">undefined</code>. An undeclared
                network call fails with a clear error. No surprises, no accidental
                exfiltration, no wild-card trust.
              </p>
            </div>

            <ul class="security-permissions">
              <li class="permission-item">
                <div class="permission-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div class="permission-body">
                  <h4>Filesystem</h4>
                  <p>Declare exact paths with <code>r</code>, <code>w</code>, or <code>rw</code> access. Path-traversal blocked at the sandbox boundary.</p>
                </div>
              </li>

              <li class="permission-item">
                <div class="permission-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <div class="permission-body">
                  <h4>Network</h4>
                  <p>Allowlist exact hosts. <code>api.github.com</code>, not <code>*</code>. Zero trust, zero exfiltration.</p>
                </div>
              </li>

              <li class="permission-item">
                <div class="permission-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div class="permission-body">
                  <h4>Secrets & env vars</h4>
                  <p>Tasks see only the env vars they declare in <code>permissions.env</code>. Resolved from encrypted store at run time.</p>
                </div>
              </li>

              <li class="permission-item">
                <div class="permission-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="4 17 10 11 4 5"/>
                    <line x1="12" y1="19" x2="20" y2="19"/>
                  </svg>
                </div>
                <div class="permission-body">
                  <h4>Shell exec</h4>
                  <p>Allowlist binaries a task can spawn. No ambient <code>bash -c</code>. Each exec auditable.</p>
                </div>
              </li>

              <li class="permission-item">
                <div class="permission-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </div>
                <div class="permission-body">
                  <h4>dicode APIs</h4>
                  <p><code>security.allowed_tasks</code> and <code>security.allowed_mcp</code> gate which tasks and MCP tools a script can call.</p>
                </div>
              </li>

              <li class="permission-item">
                <div class="permission-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <div class="permission-body">
                  <h4>Full traceability</h4>
                  <p>Every run logs capability checks, HTTP calls, file reads, and secret lookups. Review in git, audit at runtime.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    `;
  }
}
