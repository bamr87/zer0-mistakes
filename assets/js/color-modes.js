/*!
 * Color mode toggler for Zer0-Mistakes Jekyll Theme
 * Supports 18 theme variants (9 skins × light/dark modes)
 * Uses compound attributes: data-bs-theme (skin) + data-bs-mode (light/dark)
 * 
 * Based on Bootstrap's docs color mode toggler
 * Copyright 2011-2024 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */

(() => {
  'use strict'

  // Available skins
  const SKINS = ['air', 'aqua', 'contrast', 'dark', 'dirt', 'neon', 'mint', 'plum', 'sunrise']
  const MODES = ['light', 'dark']
  const STORAGE_KEY = 'themeConfig'

  /**
   * Get stored theme configuration from localStorage
   * @returns {Object} { skin: string, mode: string }
   */
  const getStoredTheme = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Failed to parse stored theme config:', e)
    }
    return null
  }

  /**
   * Store theme configuration to localStorage
   * @param {string} skin - The theme skin name
   * @param {string} mode - The mode (light/dark)
   */
  const setStoredTheme = (skin, mode) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ skin, mode }))
    } catch (e) {
      console.warn('Failed to store theme config:', e)
    }
  }

  /**
   * Get the preferred theme based on stored value or system preference
   * @returns {Object} { skin: string, mode: string }
   */
  const getPreferredTheme = () => {
    const stored = getStoredTheme()
    if (stored && SKINS.includes(stored.skin) && MODES.includes(stored.mode)) {
      return stored
    }

    // Get defaults from HTML attributes (set by Jekyll config)
    const html = document.documentElement
    const defaultSkin = html.getAttribute('data-bs-theme') || 'dark'
    const defaultMode = html.getAttribute('data-bs-mode') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

    return { skin: defaultSkin, mode: defaultMode }
  }

  /**
   * Apply theme to the document
   * @param {string} skin - The theme skin name
   * @param {string} mode - The mode (light/dark), or 'auto' for system preference
   */
  const setTheme = (skin, mode) => {
    const html = document.documentElement
    
    // Handle 'auto' mode
    let resolvedMode = mode
    if (mode === 'auto') {
      resolvedMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    // Apply compound attributes
    html.setAttribute('data-bs-theme', skin)
    html.setAttribute('data-bs-mode', resolvedMode)

    // Dispatch custom event for other scripts to react
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { skin, mode: resolvedMode, originalMode: mode }
    }))
  }

  /**
   * Update UI to show active theme
   * @param {string} skin - The active skin
   * @param {string} mode - The active mode
   * @param {boolean} focus - Whether to focus the theme switcher
   */
  const showActiveTheme = (skin, mode, focus = false) => {
    const themeSwitcher = document.querySelector('#bd-theme')
    const skinSwitcher = document.querySelector('#bd-skin')

    // Update mode toggle
    if (themeSwitcher) {
      const themeSwitcherText = document.querySelector('#bd-theme-text')
      const activeThemeIcon = document.querySelector('.theme-icon-active use')
      const btnToActive = document.querySelector(`[data-bs-theme-value="${mode}"]`)

      if (btnToActive) {
        const svgOfActiveBtn = btnToActive.querySelector('svg use')?.getAttribute('href')

        document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
          element.classList.remove('active')
          element.setAttribute('aria-pressed', 'false')
        })

        btnToActive.classList.add('active')
        btnToActive.setAttribute('aria-pressed', 'true')
        
        if (activeThemeIcon && svgOfActiveBtn) {
          activeThemeIcon.setAttribute('href', svgOfActiveBtn)
        }
        
        if (themeSwitcherText) {
          const themeSwitcherLabel = `${themeSwitcherText.textContent} (${mode})`
          themeSwitcher.setAttribute('aria-label', themeSwitcherLabel)
        }
      }

      if (focus) {
        themeSwitcher.focus()
      }
    }

    // Update skin selector
    if (skinSwitcher) {
      const skinSwitcherText = document.querySelector('#bd-skin-text')
      const btnToActive = document.querySelector(`[data-bs-skin-value="${skin}"]`)

      if (btnToActive) {
        document.querySelectorAll('[data-bs-skin-value]').forEach(element => {
          element.classList.remove('active')
          element.setAttribute('aria-pressed', 'false')
        })

        btnToActive.classList.add('active')
        btnToActive.setAttribute('aria-pressed', 'true')
        
        if (skinSwitcherText) {
          skinSwitcherText.textContent = skin.charAt(0).toUpperCase() + skin.slice(1)
        }
      }
    }
  }

  // Initialize theme immediately (before DOMContentLoaded)
  const initialTheme = getPreferredTheme()
  setTheme(initialTheme.skin, initialTheme.mode)

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const stored = getStoredTheme()
    // Only auto-update if user hasn't explicitly set a mode
    if (!stored || stored.mode === 'auto') {
      const current = getPreferredTheme()
      setTheme(current.skin, 'auto')
    }
  })

  // Set up event listeners after DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    const { skin, mode } = getPreferredTheme()
    showActiveTheme(skin, mode)

    // Mode toggle buttons (light/dark/auto)
    document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const newMode = toggle.getAttribute('data-bs-theme-value')
        const currentSkin = document.documentElement.getAttribute('data-bs-theme')
        
        setStoredTheme(currentSkin, newMode)
        setTheme(currentSkin, newMode)
        showActiveTheme(currentSkin, newMode, true)
      })
    })

    // Skin selector buttons
    document.querySelectorAll('[data-bs-skin-value]').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const newSkin = toggle.getAttribute('data-bs-skin-value')
        const currentMode = document.documentElement.getAttribute('data-bs-mode')
        
        setStoredTheme(newSkin, currentMode)
        setTheme(newSkin, currentMode)
        showActiveTheme(newSkin, currentMode, true)
      })
    })
  })

  // Expose API for programmatic control
  window.ZeroTheme = {
    getSkins: () => [...SKINS],
    getModes: () => [...MODES],
    getTheme: getPreferredTheme,
    setTheme: (skin, mode) => {
      if (!SKINS.includes(skin)) {
        console.warn(`Invalid skin: ${skin}. Available: ${SKINS.join(', ')}`)
        return false
      }
      if (!MODES.includes(mode) && mode !== 'auto') {
        console.warn(`Invalid mode: ${mode}. Available: ${MODES.join(', ')}, auto`)
        return false
      }
      setStoredTheme(skin, mode)
      setTheme(skin, mode)
      showActiveTheme(skin, mode)
      return true
    }
  }
})()