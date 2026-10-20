import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["submit", "status"];

  connect() {
    this.originalLabel = this.submitTarget.value;
    this.beforeCache = () => this.reset();
    document.addEventListener("turbo:before-cache", this.beforeCache);
  }

  start() {
    this.statusTarget.textContent = "";
    this.element.setAttribute("aria-busy", "true");
    this.submitTarget.disabled = true;
    this.submitTarget.value = "Filtering…";
  }

  end(event) {
    this.reset();
    if (!event.detail.success) {
      this.statusTarget.textContent = "Couldn’t load projects. Try again.";
    }
  }

  response(event) {
    if (event.detail.fetchResponse.succeeded) return;
    // Keep the current results and selection available for a retry.
    event.preventDefault();
    this.reset();
    this.statusTarget.textContent = "Couldn’t load projects. Try again.";
  }

  reset() {
    this.element.removeAttribute("aria-busy");
    this.submitTarget.disabled = false;
    this.submitTarget.value = this.originalLabel;
    this.statusTarget.textContent = "";
  }

  disconnect() {
    this.reset();
    document.removeEventListener("turbo:before-cache", this.beforeCache);
  }
}
