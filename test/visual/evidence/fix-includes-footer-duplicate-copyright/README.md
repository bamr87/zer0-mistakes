# Footer duplicate copyright (backlog T-054)

`_includes/core/footer.html` printed the copyright twice: `© 2026 Amr` above
the Powered-by row and `© 2026 zer0-mistakes. All Rights Reserved.` in the
bottom bar. The fix keeps only the bottom-bar line.

- `footer-before.png`: `main` (b1a9e3e) at 1280px, with two © lines.
- `footer-after.png`: this branch, with one © line.

Built site: 382 pages had two footer © notices before the fix and 0 after.
