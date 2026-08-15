Circular floating action button for the zer0-mistakes bottom-right utility stack (back-to-top, chat, table-of-contents, local-graph). Sized by `--zer0-space-fab-size`, shadowed by `--zer0-shadow-fab`, layered by `--zer0-layer-fab-*`.

```jsx
<FabStack>
  <Fab icon="arrow-up" label="Back to top" />
  <Fab icon="chat-dots" label="Ask AI" variant="light" />
  <Fab icon="list-ul" label="Table of contents" variant="light" size="sm" />
</FabStack>
```

`FabStack` pins children bottom-right in a column (first child sits at the bottom, matching the theme's back-to-top-first order); pass `fixed={false}` to demo it inside a container. Always give each `Fab` a `label` — they are icon-only. Variants: `primary` (brand fill) and `light` (elevated surface, primary icon). Load Bootstrap Icons CSS for the glyphs.
