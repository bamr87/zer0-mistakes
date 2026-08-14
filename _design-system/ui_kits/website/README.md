# Website UI Kit — zer0-mistakes marketing site

A high-fidelity, interactive recreation of the **zer0-mistakes** landing page (`https://zer0-mistakes.com/`), rebuilt from the upstream `_layouts/landing.html`, `_includes/core/header.html`, and `_data/landing.yml`.

## Run it

Open `index.html`. It loads the design-system bundle (`_ds_bundle.js`) for the shared primitives (`Button`, `Badge`, `Card`, `FeatureCard`) and Bootstrap Icons from CDN.

## What it demonstrates

- **Navbar** (`Navbar.jsx`) — fixed/sticky bar, `bg-body-tertiary`, brand cluster
(wizard logo + title + subtitle), primary nav, and the utility controls: search with `/` hint, **light/dark toggle**, **skin switcher** (all 7 skins + default), and a GitHub button.
- **Hero** (`Hero.jsx`) — solid `bg-primary` block, white `display-4` headline,
  CTA cluster, and the wizard hero art in a rounded, shadowed 4:3 frame.
- **Sections** (`Sections.jsx`) — feature-pill quick links, the three-up
**features grid** (reuses `FeatureCard`), the **Get Started** install cards (Fork / Remote-theme / Docker), and a multi-column footer.

## Interactions

- Toggle the moon/sun icon to switch **light ↔ dark** (`data-bs-theme`).
- Open the palette menu to apply any **skin** (`data-theme-skin`) live — primary,
  accent, links, and borders all re-point.

## Fidelity notes

Copy is lifted verbatim where possible from `_data/landing.yml` and `README.md`. This is a cosmetic recreation: the search modal, offcanvas drawers, and real routing are represented but not functionally wired. Components are simplified, mainly-visual versions of the Bootstrap originals.
