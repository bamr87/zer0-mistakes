Generic content surface — wrap any grouped content (post previews, panels, stats).

```jsx
<Card hover>
  <h3>Docker-first development</h3>
  <p>No Ruby, no Bundler — Docker is the only prerequisite.</p>
</Card>
```

Borderless with a soft `shadow-sm` and `.75rem` radius. Set `hover` to enable the landing-style lift (`translateY(-2px)` + `shadow-md`). For the icon-chip marketing card use `FeatureCard` instead.
