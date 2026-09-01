Shimmer loading placeholder for zer0-mistakes — use while cards, search results, or images are loading, composed into the shape of the content it replaces.

{% raw %}
```jsx
<Skeleton variant="thumbnail" />
<Skeleton variant="title" width="70%" />
<Skeleton variant="text" lines={3} />
<div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
  <Skeleton variant="avatar" />
  <Skeleton variant="text" lines={2} width="10rem" />
</div>
```
{% endraw %}

Variants: `text` (multi-line bars, last one 60%), `title`, `button`, `avatar` (circle), `thumbnail` (4:3). The shimmer is built from `--zer0-color-bg-elevated/muted` so it reads correctly in both color modes, and it stops under `prefers-reduced-motion`. Skeletons are `aria-hidden` — announce loading state separately.
