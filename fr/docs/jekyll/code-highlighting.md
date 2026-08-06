---
lastmod: 2026-04-18 19:29:52.000000000 Z
title: Coloration syntaxique du code
description: Configurez la coloration syntaxique des blocs de code dans Jekyll à l'aide
  de Rouge et Kramdown.
preview: "/images/previews/code-highlighting.png"
layout: default
categories:
- docs
- jekyll
tags:
- highlighting
- jekyll
- syntax
- rouge
difficulty: beginner
estimated_reading_time: 10 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/jekyll/code-highlighting/"
translation_of: pages/_docs/jekyll/code-highlighting.md
translation_source_url: "/docs/jekyll/code-highlighting/"
machine_translated: true
translated_from_sha: f7c0497eed72
---

# Coloration syntaxique du code

> Configurez la coloration syntaxique des blocs de code sur votre site Jekyll.

## Configuration par défaut

Le thème Zer0-Mistakes utilise Kramdown avec Rouge pour la coloration syntaxique :

```yaml
# _config.yml
markdown: kramdown
highlighter: rouge

kramdown:
  input: GFM
  syntax_highlighter: rouge
```

## Utilisation

### Blocs de code de base

Indiquez le langage après les guillemets d'ouverture :

````markdown
```python
def hello_world():
    print("Hello, World!")
```
````

### Langages pris en charge

Rouge prend en charge de nombreux langages, notamment :

- **Ruby, Python, JavaScript, TypeScript**
- **HTML, CSS, SCSS, YAML, JSON**
- **Bash, Shell, PowerShell**
- **Java, C, C++, Go, Rust**
- **SQL, GraphQL, Markdown**

Consultez la [liste complète des langages pris en charge](https://github.com/rouge-ruby/rouge/wiki/List-of-supported-languages-and-lexers).

## Alternative : highlight.js

Pour davantage de personnalisation, vous pouvez utiliser [highlight.js](https://highlightjs.org/) :

### Installation

Ajoutez à la `<head>` de votre mise en page :

```html
<link
  rel="stylesheet"
  href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/default.min.css"
/>
<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
<script>
  hljs.highlightAll();
</script>
```

### Numéros de ligne

Ajoutez des numéros de ligne avec le plugin highlightjs-line-numbers.js :

```html
<script src="//cdnjs.cloudflare.com/ajax/libs/highlightjs-line-numbers.js/2.8.0/highlightjs-line-numbers.min.js"></script>
<script>
  hljs.initLineNumbersOnLoad();
</script>
```

### Styles personnalisés

Ajoutez du CSS pour les numéros de ligne :

```css
table.hljs-ln {
  width: auto;
  border-width: 0px;
}
table.hljs-ln td {
  border-width: 0px;
}

.hljs-ln-numbers {
  text-align: center;
  color: #ccc;
  border-right: 1px solid #ccc !important;
  padding-right: 5px !important;
}

.hljs-ln-code {
  padding-left: 10px !important;
}
```

## Thèmes

### Thèmes Rouge

Rouge inclut plusieurs thèmes intégrés. Générez le CSS avec :

```bash
rougify style monokai > syntax.css
```

Thèmes disponibles : `base16`, `colorful`, `github`, `monokai`, `thankful_eyes`, et plus encore.

### Thèmes highlight.js

highlight.js prend en charge plus de 89 styles. Parcourez les thèmes sur la [page de démonstration](https://highlightjs.org/static/demo/).

Thèmes populaires :

- `atom-one-light`
- `atom-one-dark`
- `github`
- `monokai`
- `vs2015`

## Bonnes pratiques

1. **Indiquez toujours le langage** — active une coloration correcte
2. **Utilisez des blocs de code délimités** — plus lisibles que les balises `⟦15⟧⟦16⟧⟦17⟧`
3. **Gardez le code lisible** — coupez les lignes trop longues lorsque c'est possible
4. **Harmonisez avec votre thème** — choisissez une coloration qui complète le design de votre site

## Référence

- [Documentation Rouge](https://github.com/rouge-ruby/rouge)
- [Syntaxe Kramdown](https://kramdown.gettalong.org/syntax.html)
- [highlight.js](https://highlightjs.org/)

## Voir aussi

- [[Jekyll]]
- [[Syntax Highlighting]]
- [[Code Copy Button]]
