import "./styles/global.css";

import { initTheme } from "./utils/theme.js";

// Init theme as early as possible to minimize FOUC
initTheme();

// Import all components
import "./components/dc-theme-toggle.js";
import "./components/dc-nav.js";
import "./components/dc-hero.js";
import "./components/dc-ai-loop.js";
import "./components/dc-ai-how.js";
import "./components/dc-ai-examples.js";
import "./components/dc-everything-task.js";
import "./components/dc-gitops.js";
import "./components/dc-hot-reload.js";
import "./components/dc-runs-anywhere.js";
import "./components/dc-mcp-factory.js";
import "./components/dc-throwaway-ui.js";
import "./components/dc-connect.js";
import "./components/dc-multi-machine.js";
import "./components/dc-code-demo.js";
import "./components/dc-share.js";
import "./components/dc-runtimes.js";
import "./components/dc-security.js";
import "./components/dc-download.js";
import "./components/dc-pricing.js";
import "./components/dc-compare.js";
import "./components/dc-opensource.js";
import "./components/dc-footer.js";

// Legacy components still registered but removed from page
import "./components/dc-how-it-works.js";
import "./components/dc-control.js";
import "./components/dc-dx.js";
import "./components/dc-ai-control.js";

import { initScrollReveal } from "./utils/reveal.js";

// Wait for all custom elements to render, then init scroll reveal
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    initScrollReveal();
  });
});
