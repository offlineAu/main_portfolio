import { Controller } from "@hotwired/stimulus";

// A dock trigger that fans a deck of social cards up from below. Clicking the
// front card (or "Next card") flings it away and the next one slides forward;
// closing sends the stack back down and resets it.
const TOGGLE_EASE = "cubic-bezier(0.76, 0, 0.24, 1)";
const DEAL_EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const CENTER = "translate(-50%, -50%)";

export default class extends Controller {
  static targets = ["trigger", "deck", "card", "close", "footerText", "next"];

  connect() {
    this.isOpen = false;
    this.dealt = 0;
    this.keyHandler = this.keydown.bind(this);
    this.cacheHandler = () => this.close({ immediate: true });
    document.addEventListener("keydown", this.keyHandler);
    document.addEventListener("turbo:before-cache", this.cacheHandler);
    this.triggerTarget.setAttribute("role", "button");
    this.render({ toggle: false, immediate: true });
  }

  disconnect() {
    document.removeEventListener("keydown", this.keyHandler);
    document.removeEventListener("turbo:before-cache", this.cacheHandler);
    this.setPageInert(false);
  }

  toggle(event) {
    event.preventDefault();
    this.isOpen ? this.close() : this.open();
  }

  open() {
    const overlay = document.querySelector('[data-navigation-target="overlay"]');
    if (overlay && !overlay.hidden) overlay.click();
    this.previouslyFocused = document.activeElement;
    this.isOpen = true;
    this.dealt = 0;
    this.setPageInert(true);
    this.triggerTarget.setAttribute("aria-expanded", "true");
    this.deckTarget.inert = false;
    this.render({ toggle: true });
    this.closeTarget.focus();
  }

  close({ immediate = false } = {}) {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.dealt = 0;
    this.setPageInert(false);
    this.triggerTarget.setAttribute("aria-expanded", "false");
    this.render({ toggle: true, immediate });
    this.deckTarget.inert = true;
    if (!immediate) this.previouslyFocused?.focus();
  }

  deal(event) {
    if (!this.isOpen || event.target.closest("a, button")) return;
    if (this.cardTargets.indexOf(event.currentTarget) !== this.dealt) return;
    this.advance();
  }

  advance() {
    this.dealt = this.dealt >= this.cardTargets.length ? 0 : this.dealt + 1;
    this.render({ toggle: false });
  }

  keydown(event) {
    if (!this.isOpen) return;
    if (event.key === "Escape") return this.close();
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      this.deckTarget.querySelectorAll("a, button"),
    ).filter((element) => !element.closest("[inert]") || element === this.closeTarget);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  setPageInert(value) {
    document.querySelector(".workspace").inert = value;
    document.querySelector(".sidebar").inert = value;
  }

  transformFor(index) {
    if (!this.isOpen) return { t: `${CENTER} translateY(120vh)`, opacity: 1 };
    if (index < this.dealt) {
      const side = index % 2 === 0 ? -1 : 1;
      return { t: `${CENTER} translate(${side * 520}px, -600px) rotate(${side * 34}deg)`, opacity: 0 };
    }
    const depth = index - this.dealt;
    return { t: `${CENTER} translate(${depth * 14}px, ${depth * 10}px) rotate(${depth * 3}deg)`, opacity: 1 };
  }

  render({ toggle, immediate = false }) {
    const cards = this.cardTargets;
    const count = cards.length;
    const duration = immediate ? 0 : toggle ? 0.9 : 0.6;
    const ease = toggle ? TOGGLE_EASE : DEAL_EASE;
    cards.forEach((card, index) => {
      const order = this.isOpen ? index : count - 1 - index;
      const delay = toggle && count > 1 && duration ? (order / (count - 1)) * 0.3 : 0;
      const { t, opacity } = this.transformFor(index);
      card.style.transition = `transform ${duration}s ${ease} ${delay}s, opacity ${duration}s ${ease} ${delay}s`;
      card.style.transform = t;
      card.style.opacity = opacity;
      card.style.zIndex = index < this.dealt ? 0 : 100 - (index - this.dealt);
      card.inert = !(this.isOpen && index === this.dealt);
    });
    this.deckTarget.classList.toggle("is-open", this.isOpen);
    const finished = this.dealt >= count;
    this.footerTextTarget.textContent = finished
      ? "That’s everywhere — start over or close."
      : "Click the front card to see the next one.";
    this.nextTarget.firstChild.textContent = finished ? "Start over " : "Next card ";
  }
}
