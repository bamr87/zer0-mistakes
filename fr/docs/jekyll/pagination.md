---
lastmod: 2026-04-18 19:29:50.000000000 Z
title: Pagination
description: Implémentez des boutons de navigation précédent/suivant et des listes
  d'articles paginées sur votre site Jekyll.
preview: "/images/previews/pagination.png"
layout: default
categories:
- docs
- jekyll
tags:
- pagination
- jekyll
- navigation
difficulty: beginner
estimated_reading_time: 10 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/jekyll/pagination/"
translation_of: pages/_docs/jekyll/pagination.md
translation_source_url: "/docs/jekyll/pagination/"
machine_translated: true
translated_from_sha: da789c476b8b
---

# Pagination

> Ajoutez des boutons de pagination pour naviguer entre les pages et les articles.

## Vue d'ensemble

La pagination facilite la navigation des utilisateurs dans le contenu. Ce guide couvre :

1. Boutons Précédent/Suivant pour les articles
2. Listes d'articles paginées
3. Raccourcis clavier pour la navigation

## Navigation Précédent/Suivant

### Implémentation de base

Créez `_includes/pagination.html` :

```html
{% raw %}<ul class="pager">
  {% if page.previous.url %}
    <li><a class="btn btn-outline-primary" href="{{page.previous.url}}">Previous</a></li>
  {% else %}
    <li class="disable"><a class="btn btn-outline-primary disabled">Previous</a></li>
  {% endif %}
  {% if page.next.url %}
    <li class="next"><a class="btn btn-outline-primary" href="{{page.next.url}}">Next</a></li>
  {% else %}
    <li class="next disable"><a class="btn btn-outline-primary disabled">Next</a></li>
  {% endif %}
</ul>{% endraw %}
```

### Inclure dans votre mise en page

Ajoutez à votre modèle (par exemple `_layouts/journals.html`) :

```html
{% raw %}{% include pagination.html %}
<hr />
<div class="post">{{ content }}</div>
<hr />
{% include pagination.html %}{% endraw %}
```

## Ordre de tri personnalisé

Triez selon un champ personnalisé (comme `index`) plutôt que par date :

```html
{% raw %}{% if page.collection %}
  {% assign posts = site[page.collection] | sort: 'index' %}
  {% for links in posts %}
    {% if links.title == page.title %}
      {% unless forloop.first %}
        {% assign prevurl = prev.url %}
      {% endunless %}
      {% unless forloop.last %}
        {% assign next = posts[forloop.index] %}
        {% assign nexturl = next.url %}
      {% endunless %}
    {% endif %}
    {% assign prev = links %}
  {% endfor %}

  <ul class="pager">
    {% if prevurl %}
      <li><a class="btn btn-outline-primary" href="{{prevurl}}">Previous</a></li>
    {% else %}
      <li class="disable"><a class="btn btn-outline-primary disabled">Previous</a></li>
    {% endif %}
    {% if nexturl %}
      <li class="next"><a class="btn btn-outline-primary" href="{{nexturl}}">Next</a></li>
    {% else %}
      <li class="next disable"><a class="btn btn-outline-primary disabled">Next</a></li>
    {% endif %}
  </ul>
{% endif %}{% endraw %}
```

## Navigation au clavier

Ajoutez des raccourcis clavier pour la navigation avec les flèches :

```html
{% raw %}<script>
document.body.onkeyup = function(e){
  if (e.keyCode == '37') { window.location = '{{prevurl}}'; }
  if (e.keyCode == '39') { window.location = '{{nexturl}}'; }
};
</script>{% endraw %}
```

Cela permet aux utilisateurs d'appuyer sur les flèches `←` et `→` pour naviguer.

## Listes d'articles paginées

Pour paginer une liste d'articles, utilisez le plugin `jekyll-paginate` :

### Configuration

```yaml
# _config.yml
plugins:
  - jekyll-paginate

paginate: 10
paginate_path: "/blog/page:num/"
```

### Modèle

```html
{% raw %}{% for post in paginator.posts %}
  <article>
    <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
    <p>{{ post.excerpt }}</p>
  </article>
{% endfor %}

<!-- Pagination Links -->
<nav>
  {% if paginator.previous_page %}
    <a href="{{ paginator.previous_page_path }}">← Newer</a>
  {% endif %}
  
  <span>Page {{ paginator.page }} of {{ paginator.total_pages }}</span>
  
  {% if paginator.next_page %}
    <a href="{{ paginator.next_page_path }}">Older →</a>
  {% endif %}
</nav>{% endraw %}
```

## Mise en forme

Ajoutez du CSS pour les boutons de pagination :

```css
.pager {
  display: flex;
  justify-content: space-between;
  list-style: none;
  padding: 0;
  margin: 2rem 0;
}

.pager li.disable a {
  pointer-events: none;
  opacity: 0.5;
}

.pager .next {
  margin-left: auto;
}
```

## Référence

- [Documentation de la pagination Jekyll](https://jekyllrb.com/docs/pagination/)
- [Liens Précédent/Suivant dans les collections](http://stories.upthebuzzard.com/jekyll_notes/2017-02-19-prev-and-next-within-a-jekyll-collection.html)

## Voir aussi

- [[Jekyll]]
- [[Liquid]]
- [[front-matter]]
