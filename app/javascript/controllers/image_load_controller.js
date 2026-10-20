import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["image", "fallback"];

  connect() {
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
