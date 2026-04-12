import "./styles/global.css";

import { initTheme } from "./utils/theme.js";

// Init theme as early as possible to minimize FOUC
initTheme();

// Import all components
import "./components/dc-theme-toggle.js";
import "./components/dc-nav.js";
import "./components/dc-hero.js";
import "./components/dc-how-it-works.js";
import "./components/dc-gitops.js";
import "./components/dc-code-demo.js";
import "./components/dc-control.js";
import "./components/dc-share.js";
import "./components/dc-connect.js";
import "./components/dc-runs-anywhere.js";
import "./components/dc-dx.js";
import "./components/dc-ai-control.js";
import "./components/dc-download.js";
import "./components/dc-pricing.js";
import "./components/dc-compare.js";
import "./components/dc-opensource.js";
import "./components/dc-footer.js";

import { initScrollReveal } from "./utils/reveal.js";

// Wait for all custom elements to render, then init scroll reveal
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    initScrollReveal();
  });
});
