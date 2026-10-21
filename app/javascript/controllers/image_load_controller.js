import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["image", "fallback"];
  static values = { ratio: String };

  connect() {
    // Set through the CSSOM: the CSP forbids inline style attributes.
    if (this.hasRatioValue) this.element.style.aspectRatio = this.ratioValue;
    this.loaded = () => this.resolve(this.imageTarget.naturalWidth > 0);
    this.failed = () => this.resolve(false);
    this.imageTarget.addEventListener("load", this.loaded);
    this.imageTarget.addEventListener("error", this.failed);
    if (this.imageTarget.complete) this.loaded();
    else this.element.dataset.imageState = "loading";
  }

  resolve(success) {
    this.element.dataset.imageState = success ? "loaded" : "error";
    this.imageTarget.hidden = !success;
    this.fallbackTarget.hidden = success;
  }

  disconnect() {
    this.imageTarget.removeEventListener("load", this.loaded);
    this.imageTarget.removeEventListener("error", this.failed);
  }
}
