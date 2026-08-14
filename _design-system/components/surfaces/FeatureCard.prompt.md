The landing-page marketing card — a circular tinted Bootstrap-icon chip above a title and one-line description.

```jsx
<FeatureCard icon="shield-check" title="Error-Free Development"
  description="Built-in error handling and self-healing installation ensures a smooth experience." />
```

The chip defaults to a primary-tinted disc with a primary icon. Pass `iconBg` (e.g. `"var(--zer0-color-success)"`) for a solid inverted chip, matching the `icon_bg` colors used in `_data/landing.yml`. Always lifts on hover. Lay three out in a responsive grid for the features section.
