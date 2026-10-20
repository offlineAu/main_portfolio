// Turbo owns fetching, history, and scrolling; only the content animates so the
// navigation stays anchored. Slow requests get a badge without delaying fast ones.
const preference = matchMedia("(prefers-reduced-motion: reduce)");
const animations = new Set();
let visit;
let loaderTimer;
let failsafe;

function clearMotion() {
  for (const animation of animations) animation.cancel();
  animations.clear();
}

function hideLoader() {
  clearTimeout(loaderTimer);
  clearTimeout(failsafe);
  const loader = document.getElementById("navigation-loader");
  loader?.classList.remove("is-visible");
  const copy = loader?.querySelector(".navigation-loader-copy");
  if (copy) copy.textContent = "";
  document.getElementById("main-content")?.removeAttribute("aria-busy");
}

function reset() {
  hideLoader();
  clearMotion();
  visit = null;
}

function animate(element, frames, options) {
  const animation = element.animate(frames, { ...options, fill: "both" });
  animations.add(animation);
  return animation.finished.catch(() => {}).finally(() => {
    animation.cancel();
    animations.delete(animation);
  });
}

document.addEventListener("turbo:visit", (event) => {
  reset();
  if (!document.getElementById("navigation-loader")) return;
  const destination = new URL(event.detail.url, location.href);
  // Chapter links use Turbo's same-page visit lifecycle too. Leave their native
  // scrolling alone rather than showing page loading feedback.
  if (destination.pathname === location.pathname && destination.search === location.search && destination.hash) return;
  visit = { action: event.detail.action };
  document.getElementById("main-content")?.setAttribute("aria-busy", "true");
  loaderTimer = setTimeout(() => {
    const loader = document.getElementById("navigation-loader");
    const link = [...document.querySelectorAll(".nav-list a")].find(link => link.pathname === destination.pathname);
    const label = link?.textContent.trim() || "page";
    if (loader) {
      loader.querySelector(".navigation-loader-copy").textContent = `Loading ${label}…`;
      loader.classList.add("is-visible");
    }
  }, 240);
  failsafe = setTimeout(hideLoader, 15000);
});

document.addEventListener("turbo:before-render", (event) => {
  const nextMain = event.detail.newBody.querySelector("#main-content");
  if (!visit || !nextMain || preference.matches || document.documentElement.hasAttribute("data-turbo-preview") || document.documentElement.classList.contains("is-preloading")) return;
  const render = event.detail.render;
  event.detail.render = async (...args) => {
    const main = document.getElementById("main-content");
    if (main) {
      await animate(main, [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-8px)" }], {
        duration: 140, easing: "ease-in",
      });
    }
    await render(...args);
    const incoming = document.getElementById("main-content");
    if (incoming && !preference.matches) {
      // Do not hold Turbo's render lifecycle open for the entrance animation.
      animate(incoming, [{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "translateY(0)" }], {
        duration: 440, easing: "cubic-bezier(.22, 1, .36, 1)",
      });
    }
  };
});

document.addEventListener("turbo:load", () => {
  hideLoader();
  if (visit && visit.action !== "restore") document.getElementById("main-content")?.focus({ preventScroll: true });
  visit = null;
});
// Cached snapshots must contain usable content, never a half-faded page.
document.addEventListener("turbo:before-cache", () => {
  hideLoader();
  clearMotion();
});
document.addEventListener("turbo:fetch-request-error", reset);
window.addEventListener("pagehide", reset);
preference.addEventListener("change", clearMotion);
