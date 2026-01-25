---
title: Code Highlighting
description: Configure syntax highlighting for code blocks in Jekyll using Rouge and Kramdown.
layout: default
categories:
    - docs
    - jekyll
tags:
    - highlighting
    - jekyll
    - syntax
    - rouge
permalink: /docs/jekyll/code-highlighting/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
---

# Code Highlighting

> Configure syntax highlighting for code blocks in your Jekyll site.

## Default Configuration

The Zer0-Mistakes theme uses Kramdown with Rouge for syntax highlighting:

```yaml
# _config.yml
markdown: kramdown
highlighter: rouge

kramdown:
  input: GFM
  syntax_highlighter: rouge
```

## Usage

### Basic Code Blocks

Specify the language after the opening fence:

````markdown
```python
def hello_world():
    print("Hello, World!")
```
````

### Supported Languages

Rouge supports many languages including:

- **Ruby, Python, JavaScript, TypeScript**
- **HTML, CSS, SCSS, YAML, JSON**
- **Bash, Shell, PowerShell**
- **Java, C, C++, Go, Rust**
- **SQL, GraphQL, Markdown**

See the [complete list of supported languages](https://github.com/rouge-ruby/rouge/wiki/List-of-supported-languages-and-lexers).

## Alternative: highlight.js

For more customization, you can use [highlight.js](https://highlightjs.org/):

### Installation

Add to your layout's `<head>`:

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

### Line Numbers

Add line numbers with the highlightjs-line-numbers.js plugin:

```html
<script src="//cdnjs.cloudflare.com/ajax/libs/highlightjs-line-numbers.js/2.8.0/highlightjs-line-numbers.min.js"></script>
<script>
  hljs.initLineNumbersOnLoad();
</script>
```

### Custom Styles

Add CSS for line numbers:

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

## Themes

### Rouge Themes

Rouge includes several built-in themes. Generate CSS with:

```bash
rougify style monokai > syntax.css
```

Available themes: `base16`, `colorful`, `github`, `monokai`, `thankful_eyes`, and more.

### highlight.js Themes

highlight.js supports 89+ styles. Browse themes at the [demo page](https://highlightjs.org/static/demo/).

Popular themes:
- `atom-one-light`
- `atom-one-dark`
- `github`
- `monokai`
- `vs2015`

## Best Practices

1. **Always specify language** — enables proper highlighting
2. **Use fenced code blocks** — more readable than `{% raw %}{% highlight %}{% endraw %}` tags
3. **Keep code readable** — break long lines when possible
4. **Match your theme** — choose highlighting that complements your site design

## Reference

- [Rouge Documentation](https://github.com/rouge-ruby/rouge)
- [Kramdown Syntax](https://kramdown.gettalong.org/syntax.html)
- [highlight.js](https://highlightjs.org/)
