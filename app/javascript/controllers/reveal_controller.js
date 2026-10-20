import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["item"];

  connect() {
    this.preference = matchMedia("(prefers-reduced-motion: reduce)");
    this.finish = () => this.settle();
    this.animationEnd = (event) => {
      if (event.animationName === "portfolio-reveal") event.target.classList.remove("reveal-enter");
    };
    this.focus = (event) => {
      const item = event.target.closest('[data-reveal-target~="item"]');
      if (item) this.show(item, true);
    };
    this.preference.addEventListener("change", this.finish);
    document.addEventListener("turbo:before-cache", this.finish);
    this.element.addEventListener("focusin", this.focus);
    this.element.addEventListener("animationend", this.animationEnd);
    if (this.preference.matches || !("IntersectionObserver" in window)) return this.settle();
    try {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) this.show(entry.target);
        });
      }, { threshold: 0.01, rootMargin: "0px 0px -8% 0px" });
      this.itemTargets.forEach((item, index) => {
        if (item.dataset.revealDone) return;
        item.style.setProperty("--reveal-delay", `${Math.min(index * 75, 225)}ms`);
        item.style.setProperty("--reveal-rotation", `${index % 2 ? 1.5 : -1.5}deg`);
        this.observer.observe(item);
        item.classList.add("reveal-pending");
        if (item.contains(document.activeElement)) this.show(item, true);
      });
    } catch {
      this.settle();
    }
  }

  show(item, immediate = false) {
    this.observer?.unobserve(item);
    item.dataset.revealDone = "true";
    item.classList.remove("reveal-pending");
    if (!immediate) item.classList.add("reveal-enter");
    else item.classList.remove("reveal-enter");
  }

  settle() {
    this.observer?.disconnect();
    this.itemTargets.forEach((item) => this.show(item, true));
  }

  disconnect() {
    this.settle();
    this.preference.removeEventListener("change", this.finish);
    document.removeEventListener("turbo:before-cache", this.finish);
    this.element.removeEventListener("focusin", this.focus);
    this.element.removeEventListener("animationend", this.animationEnd);
  }
}
