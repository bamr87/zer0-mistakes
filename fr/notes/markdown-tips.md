---
title: Conseils de mise en forme Markdown
description: Astuces avancées de mise en forme Markdown, notamment les tableaux, notes
  de bas de page, listes de tâches et extensions GitHub Flavored Markdown
layout: note
date: 2026-01-28 10:00:00.000000000 Z
lastmod: 2026-01-31 10:00:00.000000000 Z
categories:
- Notes
- Writing
tags:
- markdown
- formatting
- writing
- documentation
author: Zer0-Mistakes Team
difficulty: beginner
comments: true
lang: fr
permalink: "/fr/notes/markdown-tips/"
translation_of: pages/_notes/markdown-tips.md
translation_source_url: "/notes/markdown-tips/"
machine_translated: true
translated_from_sha: 1c8fdb9919a6
---

## Mise en forme de base

### Emphase du texte

```markdown
*italic* or _italic_
**bold** or __bold__
***bold italic*** or ___bold italic___
~~strikethrough~~
```

*italique* | **gras** | ***gras italique*** | ~~barré~~

### Titres

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

---

## Liens et images

### Liens

```markdown
[Link text](https://example.com)
[Link with title](https://example.com "Title")
<https://example.com>
[Reference link][ref]

[ref]: https://example.com
```

### Images

```markdown
![Alt text](/path/to/image.jpg)
![Alt text](/path/to/image.jpg "Title")

<!-- With link -->
[![Alt text](/path/to/image.jpg)](https://example.com)

<!-- Reference style -->
![Alt text][img-ref]

[img-ref]: /path/to/image.jpg "Title"
```

### Dimensionnement des images (HTML)

```html
<img src="/path/to/image.jpg" alt="Alt text" width="300">

<!-- Centered image -->
<p align="center">
  <img src="/path/to/image.jpg" alt="Alt text" width="500">
</p>
```

---

## Listes

### Listes à puces

```markdown
- Item 1
- Item 2
  - Nested item
  - Another nested
- Item 3

* Alternative bullet
+ Also works
```

### Listes numérotées

```markdown
1. First item
2. Second item
   1. Nested numbered
   2. Another nested
3. Third item

<!-- Numbers don't need to be sequential -->
1. First
1. Second (renders as 2)
1. Third (renders as 3)
```

### Listes de tâches

```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task
  - [x] Nested completed
  - [ ] Nested incomplete
```

- [x] Tâche terminée
- [ ] Tâche non terminée
- [ ] Autre tâche

### Listes de définitions

```markdown
Term 1
: Definition for term 1

Term 2
: Definition for term 2
: Additional definition
```

---

## Code

### Code en ligne

```markdown
Use `code` for inline code.
Use `` `backticks` `` inside code.
```

Utilisez `code` pour le code en ligne.

### Blocs de code

````markdown
```python
def hello():
    print("Hello, World!")
```

```javascript
const greeting = () => {
    console.log("Hello!");
};
```
````

### Code avec numéros de ligne (Jekyll)

````markdown
```python
def hello():
    print("Hello, World!")
```
{: .line-numbers}
````

### Langages de coloration syntaxique

Identifiants de langage courants :
- `python`, `py`
- `javascript`, `js`
- `typescript`, `ts`
- `ruby`, `rb`
- `bash`, `shell`, `sh`
- `html`, `css`, `scss`
- `json`, `yaml`, `yml`
- `sql`, `markdown`, `md`

---

## Tableaux

### Tableau de base

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

| En-tête 1 | En-tête 2 | En-tête 3 |
|----------|----------|----------|
| Cellule 1 | Cellule 2 | Cellule 3 |
| Cellule 4 | Cellule 5 | Cellule 6 |

### Alignement

```markdown
| Left     | Center   | Right    |
|:---------|:--------:|---------:|
| Left     | Center   | Right    |
| Aligned  | Aligned  | Aligned  |
```

| Gauche | Centre | Droite |
|:---------|:--------:|---------:|
| Gauche | Centre | Droite |
| Aligné | Aligné | Aligné |

### Tableaux complexes

```markdown
| Feature | Basic | Pro | Enterprise |
|:--------|:-----:|:---:|:----------:|
| Users   | 1     | 10  | Unlimited  |
| Storage | 5GB   | 50GB| 500GB      |
| Support | Email | Chat| 24/7 Phone |
| Price   | Free  | $10 | $99        |
```

---

## Citations

### Citation simple

```markdown
> This is a blockquote.
> It can span multiple lines.
```

> Ceci est une citation.
> Elle peut s'étendre sur plusieurs lignes.

### Citations imbriquées

```markdown
> First level
>> Second level
>>> Third level
```

> Premier niveau
>> Deuxième niveau
>>> Troisième niveau

### Citation avec attribution

```markdown
> The best way to predict the future is to invent it.
>
> — Alan Kay
```

---

## Notes de bas de page

```markdown
Here is a sentence with a footnote.[^1]

Another sentence with a named footnote.[^note]

[^1]: This is the footnote content.
[^note]: This is a named footnote.
```

Voici une phrase avec une note de bas de page.[^1]

[^1]: Ceci est le contenu de la note de bas de page.

---

## Filets horizontaux

```markdown
---
***
___
```

Les trois créent un filet horizontal :

---

## Caractères spéciaux

### Échappement

```markdown
\*not italic\*
\`not code\`
\# not a heading
\[not a link\]
```

\*pas en italique\* | \`not code\`

### Entités HTML

```markdown
&copy; &reg; &trade;
&mdash; &ndash;
&larr; &rarr; &uarr; &darr;
&lt; &gt; &amp;
```

© ® ™ — – ← → ↑ ↓ < > &

---

## Fonctionnalités avancées

### Abréviations

```markdown
HTML is great for web pages.

*[HTML]: Hyper Text Markup Language
```

### Émojis

```markdown
:smile: :rocket: :thumbsup:
:warning: :bulb: :memo:
```

:smile: :rocket: :thumbsup:

### Touches du clavier

```html
Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.
```

Appuyez sur <kbd>Ctrl</kbd> + <kbd>C</kbd> pour copier.

### Sections repliables

```html
<details>
<summary>Click to expand</summary>

Hidden content here.
- Can include markdown
- And lists
- And code

</details>
```

<details>
<summary>Cliquez pour développer</summary>

Contenu masqué ici.
- Peut inclure du markdown
- Et des listes

</details>

### Alertes/Encarts (GitHub)

```markdown
> [!NOTE]
> Useful information.

> [!TIP]
> Helpful advice.

> [!IMPORTANT]
> Key information.

> [!WARNING]
> Potential issues.

> [!CAUTION]
> Serious concerns.
```

---

## Spécifique à Jekyll

### Variables Liquid

{% raw %}
```markdown
{{ page.title }}
{{ site.title }}
{{ content }}
```
{% endraw %}

### Fichiers d'inclusion

{% raw %}
```liquid
{% include note.html content="This is a note." %}
```
{% endraw %}

### Attributs Kramdown

```markdown
This paragraph has a class.
{: .custom-class}

[Link with attributes](url){: .btn .btn-primary target="_blank"}

![Image with class](/image.jpg){: .img-fluid .rounded}
```

### Table des matières

```markdown
* TOC
{:toc}
```

---

## Référence rapide

| Élément | Syntaxe |
|---------|--------|
| Gras | `**text**` |
| Italique | `*text*` |
| Code | `` `code` `` |
| Lien | `[text](url)` |
| Image | `![alt](url)` |
| Titre | `# H1` à `###### H6` |
| Liste | `- item` ou `1. item` |
| Citation | `> quote` |
| HR | `---` |
| Tâche | `- [x] done` |
| Tableau | `| H1 | H2 |` |

---

## Ressources

- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [CommonMark Spec](https://commonmark.org/)
- [Kramdown Syntax](https://kramdown.gettalong.org/syntax.html)
- [Markdown Guide](https://www.markdownguide.org/)
