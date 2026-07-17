# Evidence — author avatars never render protocol-relative `//assets/…` URLs (issue #297)

`_includes/components/author-avatar-url.html` — the single shared resolver
behind every author byline, card, E-E-A-T banner, and profile hero — built the
relative-path branch by manual slash concatenation:

```liquid
{{ site.baseurl }}/{{ site.public_folder }}{{ _avatar }}
```

Remote-theme consumers do **not** inherit the theme's `_config.yml`, so on a
site where the joined slashes double up (`public_folder` unset, or set with a
leading slash), a site-absolute avatar like `/images/authors/cassandra.svg`
rendered as `//assets/images/authors/cassandra.svg` — a **protocol-relative**
URL the browser resolves against a host literally named `assets`. Every such
avatar was a broken image. The fix builds the path in a capture, collapses
`//` → `/`, and applies `relative_url` exactly once (keeping the documented
`public_folder` prefix contract and the full-URL / GitHub-handle branches
untouched).

## How this evidence was produced

The include renders server-side, so both states are **real Jekyll builds** of
the same misconfigured consumer (`public_folder: "/assets"`): BEFORE with the
include reverted to the PR's merge-base, AFTER at the PR head — a faithful
diff of the real code change, driven by
[`../../author-avatar-evidence.mjs`](../../author-avatar-evidence.mjs)
(exact commands in its header).

## What each file shows

- **`01-authors-index.png`** — the `/authors/` index. BEFORE: the three
  authors with site-relative avatars (Zer0-Mistakes Team, Cassandra, Vega)
  render `src="//assets/…"` and show **no image**; the two full-URL (GitHub)
  avatars are unaffected. AFTER: 0 protocol-relative srcs, **5/5 avatars
  load**.
- **`02-profile-hero.png`** — the `/authors/cassandra/` profile hero. BEFORE:
  broken 128px avatar (`//assets/images/authors/cassandra.svg`). AFTER: the
  avatar renders (`/assets/images/authors/cassandra.svg`).
- **`metrics.json`** — every avatar's `src`, protocol-relative flag, and
  loaded state per page and state.

## Measured before → after (from `metrics.json`)

| Page | Protocol-relative srcs (before) | (after) | Avatars loading (after) |
|---|---|---|---|
| `/authors/` | 3 of 5 | 0 | 5/5 |
| `/authors/cassandra/` | 1 of 1 | 0 | 1/1 |

On the theme's own default config (`public_folder: assets`, no leading slash)
the pre-fix and fixed outputs are byte-identical — which is why the theme site
never showed the bug and why the regression test pins invariants rather than
a pixel state.

Regression test: [`../../features/authors.spec.js`](../../features/authors.spec.js)
("Author avatar URLs (issue #297)", smoke tier) — on every avatar surface, no
`src` may start with `//`, and every site-served avatar URL must resolve 200.
