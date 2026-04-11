/**
 * Sets up IntersectionObserver for scroll reveal animations.
 * Call once after all components have rendered.
 */
export function initScrollReveal(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  document
    .querySelectorAll(".reveal, .reveal-left, .reveal-right, .stagger")
    .forEach((el) => {
      observer.observe(el);
    });
}
