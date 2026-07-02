 /*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2024 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */

(() => {
  'use strict'

  const getStoredTheme = () => localStorage.getItem('theme')
  const setStoredTheme = theme => localStorage.setItem('theme', theme)

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme()
    if (storedTheme) {
      return storedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const setTheme = theme => {
    if (theme === 'auto') {
      document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
    } else {
      document.documentElement.setAttribute('data-bs-theme', theme)
    }
  }

  setTheme(getPreferredTheme())

  const showActiveTheme = (theme, focus = false) => {
    const activeButtons = document.querySelectorAll(`[data-bs-theme-value="${theme}"]`)
    if (!activeButtons.length) {
      return
    }

    // The control can render more than once per page (settings offcanvas +
    // theme-controls-bar), so sync active state across every instance.
    document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
      element.classList.remove('active')
      element.setAttribute('aria-pressed', 'false')
    })
    activeButtons.forEach(element => {
      element.classList.add('active')
      element.setAttribute('aria-pressed', 'true')
    })

    // Legacy dropdown affordances (#bd-theme toggle with a mirrored icon) —
    // updated only when that markup is present.
    const themeSwitcher = document.querySelector('#bd-theme')
    const activeThemeIcon = document.querySelector('.theme-icon-active use')
    const themeIconUse = activeButtons[0].querySelector('svg use')
    if (activeThemeIcon && themeIconUse) {
      activeThemeIcon.setAttribute('href', themeIconUse.getAttribute('href'))
    }
    if (themeSwitcher) {
      const themeSwitcherText = document.querySelector('#bd-theme-text')
      const baseLabel = themeSwitcherText?.textContent?.trim() || 'Toggle theme'
      themeSwitcher.setAttribute('aria-label', `${baseLabel} (${theme})`)
      if (focus) {
        themeSwitcher.focus()
      }
    }
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme()
    if (storedTheme !== 'light' && storedTheme !== 'dark') {
      setTheme(getPreferredTheme())
    }
  })

  window.addEventListener('DOMContentLoaded', () => {
    showActiveTheme(getPreferredTheme())

    document.querySelectorAll('[data-bs-theme-value]')
      .forEach(toggle => {
        toggle.addEventListener('click', () => {
          const theme = toggle.getAttribute('data-bs-theme-value')
          setStoredTheme(theme)
          setTheme(theme)
          showActiveTheme(theme, true)
        })
      })
  })
})()