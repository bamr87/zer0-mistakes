---
title: Jekyll Math with MathJax
description: "Display mathematical equations and formulas in Jekyll pages using MathJax - LaTeX-style notation for the web."
date: 2026-01-24T00:00:00.000Z
lastmod: 2026-01-24T00:00:00.000Z
tags:
  - mathjax
  - math
  - jekyll
  - latex
categories:
  - Jekyll
  - Features
layout: default
permalink: /docs/jekyll/mathjax/
mathjax: true
difficulty_level: beginner
estimated_time: "10 minutes"
keywords:
  primary: ["mathjax jekyll", "math equations", "latex web"]
  secondary: ["mathematical notation", "formulas", "scientific writing"]
---

# Jekyll Math with MathJax

> Display mathematical equations and formulas using LaTeX-style syntax with MathJax.

## Quick Start

### Step 1: Enable MathJax

Add `mathjax: true` to your page's front matter:

```yaml
---
title: "My Math Page"
mathjax: true
---
```

### Step 2: Write Equations

**Inline math** with single dollar signs:

```markdown
The Pythagorean theorem states that $a^2 + b^2 = c^2$.
```

**Display math** with double dollar signs:

```markdown
$$
E = mc^2
$$
```

---

## Configuration

### Theme Integration

The Zer0-Mistakes theme includes MathJax support. The include file loads MathJax conditionally:

```html
{% raw %}{% if page.mathjax %}
<script type="text/x-mathjax-config">
  MathJax.Hub.Config({
    tex2jax: {
      inlineMath: [ ['$','$'], ['\\(','\\)'] ],
      displayMath: [ ['$$','$$'], ['\\[','\\]'] ],
      processEscapes: true
    },
    TeX: {
      equationNumbers: { autoNumber: "AMS" }
    }
  });
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>
{% endif %}{% endraw %}
```

### CDN Options

**MathJax 3** (recommended):

```html
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>
```

**MathJax 2** (legacy):

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML" async></script>
```

---

## Syntax Examples

### Inline Math

Use single dollar signs or `\(` `\)` delimiters:

| Markdown | Result |
|----------|--------|
| `$x^2$` | $x^2$ |
| `$\sqrt{x}$` | $\sqrt{x}$ |
| `$\frac{a}{b}$` | $\frac{a}{b}$ |
| `$\sum_{i=1}^n x_i$` | $\sum_{i=1}^n x_i$ |

### Display Math

Use double dollar signs or `\[` `\]` delimiters for centered equations:

```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

### Common Formulas

**Quadratic Formula:**

```markdown
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

**Matrix:**

```markdown
$$
A = \begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$
```

$$
A = \begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$

**Equation Numbering:**

```markdown
$$
\begin{equation}
E = mc^2
\end{equation}
$$
```

---

## LaTeX Reference

### Greek Letters

| Code | Symbol | Code | Symbol |
|------|--------|------|--------|
| `\alpha` | $\alpha$ | `\beta` | $\beta$ |
| `\gamma` | $\gamma$ | `\delta` | $\delta$ |
| `\pi` | $\pi$ | `\sigma` | $\sigma$ |
| `\omega` | $\omega$ | `\theta` | $\theta$ |

### Operators

| Code | Symbol | Description |
|------|--------|-------------|
| `\sum` | $\sum$ | Summation |
| `\prod` | $\prod$ | Product |
| `\int` | $\int$ | Integral |
| `\partial` | $\partial$ | Partial derivative |
| `\infty` | $\infty$ | Infinity |
| `\approx` | $\approx$ | Approximately |
| `\neq` | $\neq$ | Not equal |
| `\leq` | $\leq$ | Less than or equal |

### Formatting

| Code | Result | Description |
|------|--------|-------------|
| `x^2` | $x^2$ | Superscript |
| `x_i` | $x_i$ | Subscript |
| `\frac{a}{b}` | $\frac{a}{b}$ | Fraction |
| `\sqrt{x}` | $\sqrt{x}$ | Square root |
| `\sqrt[n]{x}` | $\sqrt[n]{x}$ | nth root |
| `\overline{x}` | $\overline{x}$ | Overline |
| `\hat{x}` | $\hat{x}$ | Hat |

---

## Troubleshooting

### Equations Not Rendering

1. **Check front matter** — ensure `mathjax: true` is set
2. **Check delimiters** — use `$...$` for inline, `$$...$$` for display
3. **Escape special characters** — use `\\` for backslash in some contexts
4. **Check browser console** — look for MathJax loading errors

### Dollar Sign Conflicts

If you need literal dollar signs, escape them:

```markdown
The price is \$5.00, but the formula is $x^2$.
```

### Kramdown Compatibility

Kramdown processes content before MathJax. For complex equations, use the `\[` and `\]` delimiters or wrap in HTML:

```html
<div>
$$
\text{Complex equation here}
$$
</div>
```

---

## Performance Tips

1. **Only enable when needed** — use `mathjax: true` selectively
2. **Use async loading** — the CDN script includes `async` attribute
3. **Minimize equations** — complex equations slow rendering
4. **Consider pre-rendering** — for static content, use images

---

## Resources

- [MathJax Documentation](https://docs.mathjax.org/)
- [LaTeX Math Symbols](https://oeis.org/wiki/List_of_LaTeX_mathematical_symbols)
- [Detexify](https://detexify.kirelabs.org/) — Draw symbols to find LaTeX code
- [HostMath](https://www.hostmath.com/) — Online equation editor

---

*This guide is part of the [Zer0-Mistakes Jekyll Theme](https://github.com/bamr87/zer0-mistakes) documentation.*
