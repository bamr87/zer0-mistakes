import { Controller } from "@hotwired/stimulus"

// Live diff (and contrast) under an editor form: waits for a pause in typing,
// cancels any request still in flight, POSTs the form's fields to the diff
// URL and swaps the returned HTML fragment in. The server computes
// everything; this controller only carries the fields across.
//
// Generalised from zer0-CMS's markdown_preview_controller.
export default class extends Controller {
  static targets = ["output", "contrast"]
  static values = { url: String, contrastUrl: String, delay: { type: Number, default: 400 } }

  disconnect() {
    clearTimeout(this.timer)
    this.request?.abort()
  }

  queue() {
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.render(), this.delayValue)
  }

  async render() {
    this.request?.abort()
    this.request = new AbortController()
    const body = new URLSearchParams(new FormData(this.element))
    const token = document.querySelector('meta[name="csrf-token"]')?.content
    const headers = { "X-CSRF-Token": token, "Content-Type": "application/x-www-form-urlencoded", "Accept": "text/html", "X-Requested-With": "XMLHttpRequest" }
    const fetchInto = async (url, target) => {
      if (!url || !target) return
      const response = await fetch(url, { method: "POST", headers, body, signal: this.request.signal, credentials: "same-origin" })
      target.innerHTML = await response.text()
    }
    try {
      await Promise.all([
        fetchInto(this.urlValue, this.hasOutputTarget ? this.outputTarget : null),
        fetchInto(this.contrastUrlValue, this.hasContrastTarget ? this.contrastTarget : null)
      ])
    } catch (error) {
      if (error.name !== "AbortError") console.warn("preview failed", error)
    }
  }
}
