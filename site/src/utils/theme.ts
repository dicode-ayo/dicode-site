/**
 * Theme manager — persists the user's dark/light choice in localStorage,
 * respects system preference on first visit, and dispatches a
 * `dicode-theme-change` CustomEvent so components can react.
 */

export type Theme = "light" | "dark";

const STORAGE_KEY = "dicode-theme";

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function getCurrentTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  window.dispatchEvent(
    new CustomEvent<Theme>("dicode-theme-change", { detail: theme }),
  );
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage errors (private mode etc.)
  }
  applyTheme(theme);
}

export function toggleTheme(): Theme {
  const next: Theme = getCurrentTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

/**
 * Initialize the theme on page load. Call this early to prevent flash.
 */
export function initTheme(): void {
  applyTheme(getCurrentTheme());

  // Follow system preference changes only if the user hasn't explicitly chosen
  if (!getStoredTheme() && window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: light)")
      .addEventListener("change", () => {
        if (!getStoredTheme()) applyTheme(getSystemTheme());
      });
  }
}
