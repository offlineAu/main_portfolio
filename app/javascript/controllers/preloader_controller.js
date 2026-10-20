import { Controller } from "@hotwired/stimulus";
import { createPaperBurn } from "effects/paper_burn";

// Counts 0→100 against real readiness (fonts, hero portrait, window load). Moments in, the sheet catches fire
// right over the face in the hero portrait and the burn grows with the count (WebGL), so the burn itself is the
// reveal while the site loads; at 100 the rest burns off. Without WebGL it wipes up instead.
// A minimum keeps the count readable on a warm cache; a cap keeps a slow network from holding the hero hostage.
const MIN_MS = 2400;
const MAX_MS = 3200;
const IGNITE_AT = 6; // percent: just after the labels have risen in
const LOADING_BURN = 0.55; // most of the burn that may happen while counting; the rest is the finale
const NOISE_REACH = 0.17; // the shader's ragged edge runs up to this far (viewport heights) past the mean front
const FINISH_MS = 1300;
const REVEAL_MS = 900; // matches the panel wipe's transition-delay in site.css
const EXIT_MS = 3600; // failsafe for either exit, from 100%

export default class extends Controller {
  static targets = ["count", "bar", "words"];

  connect() {
    this.root = document.documentElement;
    if (!this.root.classList.contains("is-preloading")) return this.element.remove();
    this.preference = matchMedia("(prefers-reduced-motion: reduce)");
    this.finish = () => this.complete();
    this.preference.addEventListener("change", this.finish);
    document.addEventListener("turbo:before-cache", this.finish);
    this.digits = [...this.countTarget.querySelectorAll(".preloader-digit")];
    this.wordCount = this.wordsTarget.children.length;
    this.started = performance.now();
    this.shown = 0;
    this.goal = 8;
    this.track();
    this.frame = requestAnimationFrame(() => this.tick());
  }

  track() {
    const portrait = document.querySelector(".hero-portrait");
    const signals = [
      document.fonts?.ready,
      portrait?.decode().catch(() => {}),
      document.readyState === "complete" ? null : new Promise((resolve) => addEventListener("load", resolve, { once: true })),
    ].filter(Boolean);
    let settled = 0;
    if (!signals.length) this.goal = 100;
    signals.forEach((signal) => signal.then(() => {
      settled += 1;
      this.goal = 8 + (92 * settled) / signals.length;
    }));
  }

  tick() {
    const elapsed = performance.now() - this.started;
    const goal = elapsed >= MAX_MS ? 100 : Math.min(this.goal, (100 * elapsed) / MIN_MS);
    this.shown += (goal - this.shown) * 0.12;
    if (goal - this.shown < 0.4) this.shown = goal;
    this.render(Math.round(this.shown));
    if (this.shown >= 100) return this.leave();
    this.frame = requestAnimationFrame(() => this.tick());
  }

  render(value) {
    if (value === this.value) return;
    this.value = value;
    this.countTarget.dataset.value = value;
    const places = [Math.floor(value / 100), Math.floor(value / 10) % 10, value % 10];
    this.digits.forEach((digit, index) => {
      digit.style.setProperty("--digit", places[index]);
      digit.classList.toggle("is-blank", index === 0 ? value < 100 : index === 1 && value < 10);
    });
    const progress = value / 100;
    this.barTarget.style.setProperty("--progress", progress);
    this.wordsTarget.style.setProperty("--word", Math.min(this.wordCount - 1, Math.floor(progress * this.wordCount)));
    if (value >= IGNITE_AT && this.burner === undefined) this.ignite();
    // Ease out over the loading stretch, so the flame catches gently and keeps spreading.
    const t = Math.max(0, (value - IGNITE_AT) / (100 - IGNITE_AT));
    this.burner?.set(this.loadingBurn * (1 - (1 - t) * (1 - t)));
  }

  // Distance (CSS px) from the ignition point to the nearest edge of an element.
  reach(element) {
    const box = element.getBoundingClientRect();
    const dx = Math.max(box.left - this.origin.x, 0, this.origin.x - box.right);
    const dy = Math.max(box.top - this.origin.y, 0, this.origin.y - box.bottom);
    return Math.hypot(dx, dy);
  }

  // The flame catches over the face in the hero portrait underneath (the middle of the screen elsewhere).
  ignite() {
    const portrait = document.querySelector(".hero-portrait")?.getBoundingClientRect();
    this.origin = portrait?.width
      ? { x: portrait.left + portrait.width / 2, y: Math.min(innerHeight * 0.7, portrait.top + portrait.height * 0.22) }
      : { x: innerWidth / 2, y: innerHeight * 0.45 };
    // Only the top labels can catch; the counter row is kept out of reach (see loadingBurn) and exits at 100.
    this.masks = [...this.element.querySelectorAll(".preloader-row:not(.preloader-row-bottom) .preloader-mask")]
      .map((mask) => ({ mask, reach: this.reach(mask) }));
    try {
      this.burner = createPaperBurn({
        host: this.element,
        finishFrom: LOADING_BURN,
        origin: this.origin,
        paint: (context, width, height, scale) => this.paint(context, scale),
        onIgnite: () => this.element.classList.add("is-burning"),
        onReveal: () => this.reveal(),
        onFrame: (radius) => this.scorch(radius),
      });
    } catch {
      this.burner = null;
    }
    if (!this.burner) return;
    // While counting, the hole grows around the portrait but stops short of the counter and the "Loading" line,
    // so they stay on intact paper until the finale.
    const bottom = Math.min(...Array.from(this.element.querySelectorAll(".preloader-row-bottom .preloader-mask"), (mask) => this.reach(mask)));
    this.loadingBurn = Math.min(LOADING_BURN, Math.max(0.1, (bottom / innerHeight - 0.06) / this.burner.speed));
  }

  // Any label a flame tongue reaches chars and crumbles instead of floating over the hole.
  scorch(radius) {
    const ragged = radius + NOISE_REACH * innerHeight * 0.6;
    this.masks.forEach((entry) => {
      if (!entry.burnt && ragged > entry.reach) {
        entry.burnt = true;
        entry.mask.classList.add("is-burnt");
      }
    });
  }

  async leave() {
    this.timer = setTimeout(this.finish, EXIT_MS);
    this.element.classList.add("is-leaving");
    if (!this.burner) return this.wipe();
    await this.burner.finish(FINISH_MS);
    this.complete();
  }

  wipe() {
    this.element.addEventListener("transitionend", (event) => {
      if (event.target === this.element && event.propertyName === "clip-path") this.complete();
    });
    this.revealTimer = setTimeout(() => this.reveal(), REVEAL_MS);
    this.element.classList.add("is-wiping");
  }

  // The burn texture: the bare sheet. The labels, counter and progress line stay live in the DOM above it.
  paint(context, scale) {
    context.scale(scale, scale);
    context.fillStyle = getComputedStyle(this.element).backgroundColor;
    context.fillRect(0, 0, innerWidth, innerHeight);
  }

  // Tells the hero name to play its entrance as the burn (or wipe) uncovers it.
  reveal() {
    if (this.revealed) return;
    this.revealed = true;
    document.dispatchEvent(new CustomEvent("preloader:reveal"));
  }

  complete() {
    if (this.done) return;
    this.done = true;
    cancelAnimationFrame(this.frame);
    this.burner?.stop();
    clearTimeout(this.timer);
    clearTimeout(this.revealTimer);
    this.reveal();
    this.root.classList.remove("is-preloading");
    try {
      sessionStorage.setItem("preloaded", "1");
    } catch {}
    this.element.remove();
  }

  disconnect() {
    this.complete();
    this.preference?.removeEventListener("change", this.finish);
    document.removeEventListener("turbo:before-cache", this.finish);
  }
}
