import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-dx")
export class DcDx extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <section id="dx" style="background: var(--navy);">
        <div class="container">
          <p class="section-label reveal">Developer Experience</p>
          <h2 class="section-title reveal">Built for developers who ship</h2>
          <p class="section-sub reveal">A rich web dashboard to manage everything — or go CLI-only. Real code when you want it, AI when you don't. Real debugging, real confidence.</p>
          <div class="features-grid stagger">
            <div class="feature-card">
              <div class="feature-icon">&#x1F5A5;&#xFE0F;</div>
              <h3>Rich Web Dashboard</h3>
              <p>Full-featured UI: create tasks from prompts, manage TaskSets and sources, edit code with Monaco editor, view live logs, manage secrets, configure settings — all from your browser. No CLI required.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F9EA;</div>
              <h3>Test Before Production</h3>
              <p>Static validation catches schema errors instantly. Unit tests with mocked globals verify logic offline. Dry-run mode checks secret resolution and API endpoints without side effects.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F5A5;&#xFE0F;</div>
              <h3>Desktop Tray App</h3>
              <p>Runs in your system tray on macOS, Linux, and Windows. Get instant desktop notifications when tasks fail. Starts automatically on login. One click to open the dashboard.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F510;</div>
              <h3>Secrets Done Right</h3>
              <p>ChaCha20-Poly1305 encrypted local store with Argon2id key derivation. Provider chain falls back to env vars, then Vault, AWS Secrets Manager, or any custom backend. One command: <code style="color:var(--sky)">dicode secrets set MY_TOKEN xxx</code></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F4E1;</div>
              <h3>No More Ngrok</h3>
              <p>Built-in webhook relay gives you a stable public URL behind any NAT/firewall. ECDSA P-256 cryptographic identity. No accounts, no config, no monthly ngrok bill. Just enable it.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F9E0;</div>
              <h3>AI in Your Editor</h3>
              <p>Monaco editor with built-in AI panel. Ask: "rewrite this to batch API calls" — AI modifies the file in-place. Streaming responses, full context, works with Claude, GPT, or any OpenAI-compatible model.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
