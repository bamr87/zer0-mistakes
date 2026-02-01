---
title: "Markdown Formatting Tips"
description: "Advanced Markdown formatting tricks including tables, footnotes, task lists, and GitHub Flavored Markdown extensions"
layout: note
date: 2026-01-28T10:00:00.000Z
lastmod: 2026-01-31T10:00:00.000Z
categories: [Notes, Writing]
tags: [markdown, formatting, writing, documentation]
author: "Zer0-Mistakes Team"
difficulty: beginner
comments: true
permalink: /notes/markdown-tips/
---

## Basic Formatting

### Text Emphasis

```markdown
*italic* or _italic_
**bold** or __bold__
***bold italic*** or ___bold italic___
~~strikethrough~~
```

*italic* | **bold** | ***bold italic*** | ~~strikethrough~~

### Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

---

## Links & Images

### Links

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

### Image Sizing (HTML)

```html
<img src="/path/to/image.jpg" alt="Alt text" width="300">

<!-- Centered image -->
<p align="center">
  <img src="/path/to/image.jpg" alt="Alt text" width="500">
</p>
```

---

## Lists

### Unordered Lists

```markdown
- Item 1
- Item 2
  - Nested item
  - Another nested
- Item 3

* Alternative bullet
+ Also works
```

### Ordered Lists

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

### Task Lists

```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task
  - [x] Nested completed
  - [ ] Nested incomplete
```

- [x] Completed task
- [ ] Incomplete task
- [ ] Another task

### Definition Lists

```markdown
Term 1
: Definition for term 1

Term 2
: Definition for term 2
: Additional definition
```

---

## Code

### Inline Code

```markdown
Use `code` for inline code.
Use `` `backticks` `` inside code.
```

Use `code` for inline code.

### Code Blocks

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

### Code with Line Numbers (Jekyll)

````markdown
```python
def hello():
    print("Hello, World!")
```
{: .line-numbers}
````

### Syntax Highlighting Languages

Common language identifiers:
- `python`, `py`
- `javascript`, `js`
- `typescript`, `ts`
- `ruby`, `rb`
- `bash`, `shell`, `sh`
- `html`, `css`, `scss`
- `json`, `yaml`, `yml`
- `sql`, `markdown`, `md`

---

## Tables

### Basic Table

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

### Alignment

```markdown
| Left     | Center   | Right    |
|:---------|:--------:|---------:|
| Left     | Center   | Right    |
| Aligned  | Aligned  | Aligned  |
```

| Left     | Center   | Right    |
|:---------|:--------:|---------:|
| Left     | Center   | Right    |
| Aligned  | Aligned  | Aligned  |

### Complex Tables

```markdown
| Feature | Basic | Pro | Enterprise |
|:--------|:-----:|:---:|:----------:|
| Users   | 1     | 10  | Unlimited  |
| Storage | 5GB   | 50GB| 500GB      |
| Support | Email | Chat| 24/7 Phone |
| Price   | Free  | $10 | $99        |
```

---

## Blockquotes

### Simple Quote

```markdown
> This is a blockquote.
> It can span multiple lines.
```

> This is a blockquote.
> It can span multiple lines.

### Nested Quotes

```markdown
> First level
>> Second level
>>> Third level
```

> First level
>> Second level
>>> Third level

### Quote with Attribution

```markdown
> The best way to predict the future is to invent it.
>
> — Alan Kay
```

---

## Footnotes

```markdown
Here is a sentence with a footnote.[^1]

Another sentence with a named footnote.[^note]

[^1]: This is the footnote content.
[^note]: This is a named footnote.
```

Here is a sentence with a footnote.[^1]

[^1]: This is the footnote content.

---

## Horizontal Rules

```markdown
---
***
___
```

All three create a horizontal rule:

---

## Special Characters

### Escaping

```markdown
\*not italic\*
\`not code\`
\# not a heading
\[not a link\]
```

\*not italic\* | \`not code\`

### HTML Entities

```markdown
&copy; &reg; &trade;
&mdash; &ndash;
&larr; &rarr; &uarr; &darr;
&lt; &gt; &amp;
```

© ® ™ — – ← → ↑ ↓ < > &

---

## Advanced Features

### Abbreviations

```markdown
HTML is great for web pages.

*[HTML]: Hyper Text Markup Language
```

### Emoji

```markdown
:smile: :rocket: :thumbsup:
:warning: :bulb: :memo:
```

:smile: :rocket: :thumbsup:

### Keyboard Keys

```html
Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.
```

Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.

### Collapsible Sections

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
<summary>Click to expand</summary>

Hidden content here.
- Can include markdown
- And lists

</details>

### Alerts/Callouts (GitHub)

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

## Jekyll-Specific

### Liquid Variables

{% raw %}
```markdown
{{ page.title }}
{{ site.title }}
{{ content }}
```
{% endraw %}

### Include Files

{% raw %}
```liquid
{% include note.html content="This is a note." %}
```
{% endraw %}

### Kramdown Attributes

```markdown
This paragraph has a class.
{: .custom-class}

[Link with attributes](url){: .btn .btn-primary target="_blank"}

![Image with class](/image.jpg){: .img-fluid .rounded}
```

### Table of Contents

```markdown
* TOC
{:toc}
```

---

## Quick Reference

| Element | Syntax |
|---------|--------|
| Bold | `**text**` |
| Italic | `*text*` |
| Code | `` `code` `` |
| Link | `[text](url)` |
| Image | `![alt](url)` |
| Heading | `# H1` to `###### H6` |
| List | `- item` or `1. item` |
| Quote | `> quote` |
| HR | `---` |
| Task | `- [x] done` |
| Table | `| H1 | H2 |` |

---

## Resources

- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [CommonMark Spec](https://commonmark.org/)
- [Kramdown Syntax](https://kramdown.gettalong.org/syntax.html)
- [Markdown Guide](https://www.markdownguide.org/)
