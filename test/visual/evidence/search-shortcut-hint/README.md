# Evidence — navbar search shortcut affordance (`/` chip + hover hints)

The search shortcuts (`/` and `⌘`/`Ctrl`+`K`) have always worked (`assets/js/search-modal.js`), but nothing in the UI advertised them — the design system's navbar (`_design-system/ui_kits/website/Navbar.jsx`) shows the affordance the theme lacked: a quiet `<kbd>/</kbd>` chip on the search button plus a shortcut hover title.

- **`01-before-after.png`** — at 1280px and 1440px the AFTER navbar carries the `/` chip beside the search icon (at 1440px next to the "Search" label, exactly as in the design); BEFORE lacks it. Nav labels and layout are otherwise identical — the chip is `d-xl-inline-flex` so the tight 992–1199px container-query tier keeps its label budget (an earlier `d-lg` draft tipped that tier to icons-only; caught in this evidence run and corrected).
- **`02-viewport-matrix.png`** — full sweep 320→1440px: no chip in mobile/tablet navbars, no overflow at any width (`metrics.json`: before=after=0 overflow everywhere).

Also in this change, not visible in the montage: hover titles with shortcut hints on the search button (`Search — press / or Ctrl+K`, swapped to `⌘K` on macOS), the sidebar (`b`) and TOC (`t`) hide toggles, `aria-keyshortcuts` on all three, and a `⌘/Ctrl+K` row in the keyboard-shortcuts modal. Regression tests: `test/visual/features/search.spec.js` ("opens on Cmd/Ctrl+K shortcut", "search button advertises the shortcuts").
