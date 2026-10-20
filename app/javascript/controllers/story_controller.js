import { Controller } from "@hotwired/stimulus";

// Walks a case study: the step nearest the reading line decides which screenshot is shown
// in the sticky stage and which chapter link is current. Without this controller the
// stage stays hidden and every step shows its own inline image.
export default class extends Controller {
  static targets = ["chapter", "link", "frame"];

  connect() {
    this.schedule = () => {
      if (this.frame) return;
      this.frame = requestAnimationFrame(() => {
        this.frame = null;
        this.update();
      });
    };
    window.addEventListener("scroll", this.schedule, { passive: true });
    window.addEventListener("resize", this.schedule);
    this.element.classList.add("story-live");
    this.update();
  }

  update() {
    const topbar = document.querySelector(".topbar")?.getBoundingClientRect().height || 0;
    const line = topbar + (innerHeight - topbar) * 0.5;
    let active = this.chapterTargets[0];
    this.chapterTargets.forEach((chapter) => {
      if (chapter.getBoundingClientRect().top <= line) active = chapter;
    });
    this.linkTargets.forEach((link) => {
      if (active && link.hash === `#${active.dataset.act || active.id}`) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
    this.frameTargets.forEach((frame) => {
      frame.toggleAttribute("data-active", Boolean(active) && frame.dataset.frame === active.dataset.frame);
    });
  }

  disconnect() {
    window.removeEventListener("scroll", this.schedule);
    window.removeEventListener("resize", this.schedule);
    cancelAnimationFrame(this.frame);
    this.element.classList.remove("story-live");
  }
}
