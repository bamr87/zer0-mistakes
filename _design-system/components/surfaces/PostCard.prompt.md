Blog preview card for zer0-mistakes — use wherever posts, docs, or articles are listed (news grids, section indexes, archives, "related posts").

```jsx
<PostCard
  title="Zero to hero in five minutes"
  excerpt="Pick a template, write Markdown, push to GitHub — your site is live."
  category="quickstart"
  date="Aug 14, 2026"
  readingTime="4 min read"
  author="bamr87"
  image="../../assets/images/zer0-checkpoint-1.png"
  featured
  href="#"
/>
```

The preview area is always 4:3; omit `image` to get the warm-to-cool gradient placeholder (accent → primary), matching the AI-generated preview-image vibe. `breaking` adds the red lightning badge top-left, `featured` the gold star top-right. Meta strings are display-ready text (the component does no date formatting). Lay several out in a CSS grid with `--zer0-space-4` gaps for the standard blog grid. Load Bootstrap Icons CSS for the meta glyphs.
