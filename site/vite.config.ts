import { defineConfig, type Plugin } from "vite";
import { resolve } from "path";
import { copyFileSync } from "fs";

/**
 * Copies theme.css to the build output root so external projects can
 * reference it at a stable URL: https://dicode-ayo.github.io/dicode-site/theme.css
 */
function copyThemeCss(): Plugin {
  return {
    name: "dicode-copy-theme-css",
    closeBundle() {
      const src = resolve(__dirname, "src/styles/theme.css");
      const dest = resolve(__dirname, "../docs/theme.css");
      copyFileSync(src, dest);
      console.log("\n  copied  theme.css -> docs/theme.css");
    },
  };
}

export default defineConfig({
  root: resolve(__dirname),
  base: "/",
  build: {
    outDir: resolve(__dirname, "../docs"),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        theme: resolve(__dirname, "theme.html"),
      },
    },
  },
  plugins: [copyThemeCss()],
});
