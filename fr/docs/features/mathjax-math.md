---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: MathJax Math
description: Affichez des équations et des formules mathématiques dans les pages Jekyll
  à l'aide de MathJax — notation de style LaTeX pour le web.
preview: "/images/previews/mathjax-math.png"
layout: default
categories:
- docs
- features
tags:
- mathjax
- math
- jekyll
- latex
mathjax: true
difficulty: beginner
estimated_reading_time: 10 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/mathjax-math/"
translation_of: pages/_docs/features/mathjax-math.md
translation_source_url: "/docs/features/mathjax-math/"
machine_translated: true
translated_from_sha: ad2447aad6d4
---

# MathJax Math

> Affichez des équations et formules mathématiques en utilisant une syntaxe de style LaTeX avec MathJax.

![Un tableau associant le code source LaTeX au rendu obtenu — $x^2$, $\sqrt{x}$, $\frac{a}{b}$ et $\sum_{i=1}^n x_i$ chacun composé en véritables mathématiques par MathJax](/assets/images/docs/features/mathjax-math.png)

## Démarrage rapide

### Étape 1 : Activer MathJax

Ajoutez `mathjax: true` au front matter de votre page :

```yaml
---
title: "My Math Page"
mathjax: true
---
```

### Étape 2 : Écrire des équations

**Mathématiques en ligne** avec des signes dollar simples :

```markdown
The Pythagorean theorem states that $a^2 + b^2 = c^2$.
```

**Mathématiques affichées** avec des doubles signes dollar :

```markdown
$$
E = mc^2
$$
```

---

## Configuration

### Intégration au thème

Le thème inclut la prise en charge de MathJax. Le fichier d'inclusion charge MathJax de manière conditionnelle :

```html
{% raw %}{% if page.mathjax %}
<!-- MathJax 3 configuration — must appear before the script tag.
     Enables $...$ inline math (off by default in MathJax 3). -->
<script>
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true
  }
};
</script>
<script id="MathJax-script" async
  src="{{ '/assets/vendor/mathjax/es5/tex-mml-chtml.js' | relative_url }}"></script>
{% endif %}{% endraw %}
```

---

## Exemples de syntaxe

### Mathématiques en ligne

Utilisez des signes dollar simples ou les délimiteurs `\(` `\)` :

| Markdown | Résultat |
|----------|--------|
| `$x^2$` | $x^2$ |
| `$\sqrt{x}$` | $\sqrt{x}$ |
| `$\frac{a}{b}$` | $\frac{a}{b}$ |
| `$\sum_{i=1}^n x_i$` | $\sum_{i=1}^n x_i$ |

### Mathématiques affichées

Utilisez des doubles signes dollar ou les délimiteurs `\[` `\]` pour des équations centrées :

```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

$$ \int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2} $$

### Formules courantes

**Formule quadratique :**

```markdown
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

$$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$

**Matrice :**

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
c & d \end{pmatrix} $$

---

## Référence LaTeX

### Lettres grecques

| Code | Symbole | Code | Symbole |
|------|--------|------|--------|
| `\alpha` | $\alpha$ | `\beta` | $\beta$ |
| `\gamma` | $\gamma$ | `\delta` | $\delta$ |
| `\pi` | $\pi$ | `\sigma` | $\sigma$ |
| `\omega` | $\omega$ | `\theta` | $\theta$ |

### Opérateurs

| Code | Symbole | Description |
|------|--------|-------------|
| `\sum` | $\sum$ | Sommation |
| `\prod` | $\prod$ | Produit |
| `\int` | $\int$ | Intégrale |
| `\partial` | $\partial$ | Dérivée partielle |
| `\infty` | $\infty$ | Infini |
| `\approx` | $\approx$ | Approximativement |
| `\neq` | $\neq$ | Différent de |
| `\leq` | $\leq$ | Inférieur ou égal |

### Mise en forme

| Code | Résultat | Description |
|------|--------|-------------|
| `x^2` | $x^2$ | Exposant |
| `x_i` | $x_i$ | Indice |
| `\frac{a}{b}` | $\frac{a}{b}$ | Fraction |
| `\sqrt{x}` | $\sqrt{x}$ | Racine carrée |
| `\sqrt[n]{x}` | $\sqrt[n]{x}$ | Racine n-ième |
| `\overline{x}` | $\overline{x}$ | Surlignage |
| `\hat{x}` | $\hat{x}$ | Accent circonflexe |

---

## Dépannage

### Les équations ne s'affichent pas

1. **Vérifiez le front matter** — assurez-vous que `mathjax: true` est défini
2. **Vérifiez les délimiteurs** — utilisez `$...$` pour le mode en ligne, `$$...$$` pour le mode affiché
3. **Échappez les caractères spéciaux** — utilisez `\\` pour la barre oblique inverse dans certains contextes
4. **Vérifiez la console du navigateur** — recherchez les erreurs de chargement de MathJax

### Conflits liés au signe dollar

Si vous avez besoin de signes dollar littéraux, échappez-les :

```markdown
The price is \$5.00, but the formula is $x^2$.
```

### Compatibilité avec Kramdown

Kramdown traite le contenu avant MathJax. Pour les équations complexes, utilisez les délimiteurs `\[` et `\]` ou encapsulez-les dans du HTML :

```html
<div>
$$
\text{Complex equation here}
$$
</div>
```

---

## Conseils de performance

1. **Activez uniquement lorsque nécessaire** — utilisez `mathjax: true` de façon sélective
2. **Utilisez le chargement asynchrone** — le script CDN inclut l'attribut `async`
3. **Réduisez le nombre d'équations** — les équations complexes ralentissent le rendu
4. **Envisagez le pré-rendu** — pour le contenu statique, utilisez des images

---

## Ressources

- [Documentation MathJax](https://docs.mathjax.org/)
- [Symboles mathématiques LaTeX](https://oeis.org/wiki/List_of_LaTeX_mathematical_symbols)
- [Detexify](https://detexify.kirelabs.org/) — Dessinez des symboles pour trouver le code LaTeX
- [HostMath](https://www.hostmath.com/) — Éditeur d'équations en ligne

---

*Ce guide fait partie de la documentation du [thème Jekyll Zer0-Mistakes](https://github.com/bamr87/zer0-mistakes).*

## Voir aussi

- [[Features]]
- [[Mermaid Diagrams]]
- [[Jupyter Notebook Integration]]
