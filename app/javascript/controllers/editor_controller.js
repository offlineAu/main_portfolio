import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["submit", "status"];
  submitting() {
    this.statusTarget.textContent = "Saving your changes…";
  }
}
