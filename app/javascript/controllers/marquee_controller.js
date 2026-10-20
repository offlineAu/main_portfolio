import { Controller } from "@hotwired/stimulus";

// Pauses the skills marquee whenever it can't be seen (scrolled away or tab
// hidden) so low-end machines don't keep animating off-screen work.
export default class extends Controller {
  connect() {
    this.visible = true;
    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.sync();
    });
    this.observer.observe(this.element);
    this.visibilityHandler = () => this.sync();
    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  disconnect() {
    this.observer?.disconnect();
    document.removeEventListener("visibilitychange", this.visibilityHandler);
  }

  sync() {
    this.element.classList.toggle("is-paused", !this.visible || document.hidden);
  }
}
