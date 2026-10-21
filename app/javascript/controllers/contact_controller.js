import { Controller } from "@hotwired/stimulus";

// Contact details arrive encoded so address harvesters scanning the HTML don't find them.
// Without JavaScript, links fall back to the contact page and text shows a masked version.
export default class extends Controller {
  static targets = ["link", "text"];
  static values = { value: String, scheme: { type: String, default: "mailto" } };

  connect() {
    let value;
    try {
      value = atob(this.valueValue).split("").reverse().join("");
    } catch {
      return;
    }
    const target = this.schemeValue === "tel" ? value.replace(/[^+0-9]/g, "") : value;
    const links = this.element instanceof HTMLAnchorElement ? [this.element, ...this.linkTargets] : this.linkTargets;
    links.forEach((link) => (link.href = `${this.schemeValue}:${target}`));
    this.textTargets.forEach((text) => (text.textContent = value));
  }
}
