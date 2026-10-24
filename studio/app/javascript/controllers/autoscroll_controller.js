import { Controller } from "@hotwired/stimulus"

// Keeps a live log box scrolled to its newest line as Turbo Streams append
// to it, unless the reader has scrolled up to look at something.
export default class extends Controller {
  connect() {
    this.pinned = true
    this.element.addEventListener("scroll", () => {
      const el = this.element
      this.pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 24
    })
    this.observer = new MutationObserver(() => {
      if (this.pinned) this.element.scrollTop = this.element.scrollHeight
    })
    this.observer.observe(this.element, { childList: true, subtree: true })
    this.element.scrollTop = this.element.scrollHeight
  }

  disconnect() {
    this.observer?.disconnect()
  }
}
