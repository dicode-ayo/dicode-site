import "./styles/global.css";

import { initTheme } from "./utils/theme.js";

// Init theme as early as possible to minimize FOUC
initTheme();

// Import only what the theme page needs
import "./components/dc-theme-toggle.js";
import "./components/dc-nav.js";
import "./components/dc-theme-showcase.js";
import "./components/dc-footer.js";
