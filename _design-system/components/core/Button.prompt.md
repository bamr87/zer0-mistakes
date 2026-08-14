Themed Bootstrap 5.3 button for zer0-mistakes — use for every CTA, form submit, and toolbar action.

```jsx
<Button variant="primary" size="lg" icon="rocket-takeoff">Get Started</Button>
<Button variant="outline-primary" icon="list-check">Features</Button>
<Button variant="ghost" icon="github" iconPosition="end" href="https://github.com/bamr87/zer0-mistakes">GitHub</Button>
```

Variants: `primary` (mixes toward accent on hover), `secondary`, `light`, `outline-primary` (fills on hover), `ghost`. Sizes: `sm` / `md` / `lg`. Pass `icon` as a Bootstrap Icon name without the `bi-` prefix; load the Bootstrap Icons CSS for icons to render. Set `href` to render as a link. Always shows the token focus ring on keyboard focus.
