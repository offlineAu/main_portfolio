import { Controller } from "@hotwired/stimulus";

// A light deterrent on portfolio images only: no "Save image" menu and no drag-out.
// Links, text and the rest of the page keep their normal browser behaviour.
export default class extends Controller {
  connect() {
    this.block = (event) => {
      if (event.target instanceof Element && event.target.closest(".protected-media")) event.preventDefault();
    };
    this.element.addEventListener("contextmenu", this.block);
    this.element.addEventListener("dragstart", this.block);
  }

  disconnect() {
    this.element.removeEventListener("contextmenu", this.block);
    this.element.removeEventListener("dragstart", this.block);
  }
}
