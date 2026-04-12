import { html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

export interface IconData {
  width: number;
  height: number;
  body: string;
}

/**
 * Render an Iconify icon (@iconify-icons/logos format) as an inline SVG.
 *
 * @param icon - Icon data from @iconify-icons/logos
 * @param className - Optional CSS class to apply to the <svg> root
 */
export function renderIcon(icon: IconData, className = "") {
  const classAttr = className ? ` class="${className}"` : "";
  return html`${unsafeHTML(
    `<svg${classAttr} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width} ${icon.height}" aria-hidden="true">${icon.body}</svg>`,
  )}`;
}
