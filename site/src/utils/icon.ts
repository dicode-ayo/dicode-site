import { html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

export interface IconData {
  width: number;
  height: number;
  body: string;
}

export interface RenderIconOptions {
  /** Additional CSS classes to apply to the <svg> */
  className?: string;
  /**
   * When true, adds the `.icon-adaptive` class so the icon is auto-inverted
   * in dark mode. Use for brand icons with a hardcoded black fill like
   * GitHub, Apple, Notion, where readability suffers on a dark background.
   */
  adaptive?: boolean;
}

/**
 * Render an Iconify icon (@iconify-icons/logos format) as an inline SVG.
 *
 * @param icon - Icon data from @iconify-icons/logos
 * @param optsOrClass - Either an options object or a plain string class
 */
export function renderIcon(
  icon: IconData,
  optsOrClass: RenderIconOptions | string = {},
) {
  const opts =
    typeof optsOrClass === "string" ? { className: optsOrClass } : optsOrClass;
  const classes = [opts.className, opts.adaptive ? "icon-adaptive" : ""]
    .filter(Boolean)
    .join(" ");
  const classAttr = classes ? ` class="${classes}"` : "";
  return html`${unsafeHTML(
    `<svg${classAttr} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width} ${icon.height}" aria-hidden="true">${icon.body}</svg>`,
  )}`;
}
