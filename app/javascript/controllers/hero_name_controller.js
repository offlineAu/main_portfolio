import { Controller } from "@hotwired/stimulus";

// Hero name motion: letters rise in (as the preloader burn uncovers them on a first visit), the front copy of the
// surname then dissolves so it sinks behind the portrait, and the lines drift apart on scroll and lean toward the
// cursor (layers of one line move together). The text stays plain in the HTML and in Turbo's cache.
const DISSOLVE_DELAY = 2300;
export default class extends Controller {
  static targets = ["line"];

  connect() {
    this.preference = matchMedia("(prefers-reduced-motion: reduce)");
    this.fine = matchMedia("(pointer: fine)");
    this.originals = this.lineTargets.map((line) => line.textContent);
    this.reset = () => this.restore();
    this.motionChange = () => (this.preference.matches ? this.stop() : this.start());
    this.reveal = () => this.enter();
    this.queue = () => this.schedule();
    this.pointer = (event) => {
      this.pointerX = (event.clientX / innerWidth) * 2 - 1;
      this.pointerY = (event.clientY / innerHeight) * 2 - 1;
      this.schedule();
    };
    document.addEventListener("turbo:before-cache", this.reset);
    this.preference.addEventListener("change", this.motionChange);
    if (!this.preference.matches) this.start();
  }

  start() {
    this.split();
    this.pointerX = this.pointerY = 0;
    this.drift = { x: 0, y: 0 };
    addEventListener("scroll", this.queue, { passive: true });
    if (this.fine.matches) addEventListener("pointermove", this.pointer, { passive: true });
    if (document.documentElement.classList.contains("is-preloading")) {
      document.addEventListener("preloader:reveal", this.reveal, { once: true });
    } else {
      this.enter();
    }
  }

  split() {
    if (this.chars) return;
    // Layers of the same line share indexes so the solid and outline copies rise in lockstep.
    const offsets = {};
    let next = 0;
    this.chars = [];
    this.lineTargets.forEach((line) => {
      const group = line.dataset.group;
      if (!(group in offsets)) {
        offsets[group] = next;
        next += line.textContent.trim().length;
      }
      let index = offsets[group];
      const words = line.textContent.trim().split(/\s+/);
      line.textContent = "";
      words.forEach((word, wordIndex) => {
        const wrapper = document.createElement("span");
        wrapper.className = "hero-word";
        [...word].forEach((letter) => {
          const char = document.createElement("span");
          char.className = "hero-char";
          char.textContent = letter;
          char.dataset.index = index++;
          wrapper.append(char);
          this.chars.push(char);
        });
        line.append(wrapper);
        if (wordIndex < words.length - 1) line.append(" ");
      });
    });
  }

  enter() {
    this.chars?.forEach((char) => char.animate(
      [
        { opacity: 0, transform: "translateY(0.55em) rotate(7deg)", filter: "blur(10px)" },
        { opacity: 1, transform: "none", filter: "blur(0)" },
      ],
      { duration: 1100, delay: 120 + Number(char.dataset.index) * 42, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "backwards" },
    ));
    // Letter by letter the front surname smokes away, leaving its twin behind the portrait.
    this.lineTargets.filter((line) => "dissolve" in line.dataset).forEach((line) => {
      line.querySelectorAll(".hero-char").forEach((char, index) => char.animate(
        [
          { opacity: 1, filter: "blur(0)", transform: "none" },
          { opacity: 0.55, filter: "blur(2px)", transform: "translateY(-0.01em) scale(1.01)", offset: 0.35 },
          { opacity: 0, filter: "blur(14px)", transform: "translateY(-0.05em) scale(1.06)" },
        ],
        { duration: 1900, delay: DISSOLVE_DELAY + index * 120, easing: "ease-in-out", fill: "forwards" },
      ));
    });
  }

  schedule() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => this.render());
  }

  render() {
    this.frame = null;
    const progress = Math.min(1, Math.max(0, scrollY / (this.element.offsetHeight || innerHeight)));
    // Ease the cursor lean so quick flicks glide instead of snapping.
    this.drift.x += (this.pointerX - this.drift.x) * 0.12;
    this.drift.y += (this.pointerY - this.drift.y) * 0.12;
    const transforms = {
      first: `translate3d(${-progress * 9 - this.drift.x * 1.2}%, ${progress * -18 - this.drift.y * 6}px, 0)`,
      last: `translate3d(${progress * 9 + this.drift.x * 1.8}%, ${progress * 24 + this.drift.y * 10}px, 0)`,
    };
    this.lineTargets.forEach((line) => (line.style.transform = transforms[line.dataset.group] ?? ""));
    if (Math.abs(this.pointerX - this.drift.x) > 0.002 || Math.abs(this.pointerY - this.drift.y) > 0.002) this.schedule();
  }

  stop() {
    removeEventListener("scroll", this.queue);
    removeEventListener("pointermove", this.pointer);
    document.removeEventListener("preloader:reveal", this.reveal);
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.restore();
  }

  restore() {
    this.lineTargets.forEach((line, index) => {
      line.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      line.textContent = this.originals[index];
      line.style.transform = "";
    });
    this.chars = null;
  }

  disconnect() {
    this.stop();
    document.removeEventListener("turbo:before-cache", this.reset);
    this.preference.removeEventListener("change", this.motionChange);
  }
}
