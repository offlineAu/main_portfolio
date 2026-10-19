import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["drawer", "overlay", "trigger"];

  connect() {
    this.keyHandler = this.keydown.bind(this);
    this.resizeHandler = () => {
      if (window.innerWidth >= 1024) this.close();
    };
    this.cacheHandler = this.close.bind(this);
    document.addEventListener("keydown", this.keyHandler);
    document.addEventListener("turbo:before-cache", this.cacheHandler);
    window.addEventListener("resize", this.resizeHandler);
  }

  disconnect() {
    document.removeEventListener("keydown", this.keyHandler);
    document.removeEventListener("turbo:before-cache", this.cacheHandler);
    window.removeEventListener("resize", this.resizeHandler);
    document.body.classList.remove("navigation-open");
  }

  open() {
    this.previouslyFocused = document.activeElement;
    this.drawerTarget.classList.add("is-open");
    this.overlayTarget.hidden = false;
    this.triggerTarget.setAttribute("aria-expanded", "true");
    this.drawerTarget.setAttribute("role", "dialog");
    this.drawerTarget.setAttribute("aria-modal", "true");
    document.querySelector(".workspace").inert = true;
    document.body.classList.add("navigation-open");
    this.drawerTarget.querySelector(".drawer-close").focus();
  }

  close() {
    const wasOpen = this.drawerTarget.classList.contains("is-open");
    this.drawerTarget.classList.remove("is-open");
    this.overlayTarget.hidden = true;
    this.triggerTarget.setAttribute("aria-expanded", "false");
    this.drawerTarget.removeAttribute("role");
    this.drawerTarget.removeAttribute("aria-modal");
    document.querySelector(".workspace").inert = false;
    document.body.classList.remove("navigation-open");
    if (wasOpen) this.previouslyFocused?.focus();
  }

  keydown(event) {
    if (!this.drawerTarget.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      this.close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      this.drawerTarget.querySelectorAll("a, button"),
    ).filter((element) => element.offsetParent !== null);
    const first = focusable[0],
      last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
