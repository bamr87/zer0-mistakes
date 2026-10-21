import { Controller } from "@hotwired/stimulus"

// The narrow-screen navigation drawer: open/close by toggling a body class;
// the scrim closes it.
export default class extends Controller {
  static targets = ["panel"]

  toggle() {
    document.body.classList.toggle("nav-open")
  }

  close() {
    document.body.classList.remove("nav-open")
  }
}
