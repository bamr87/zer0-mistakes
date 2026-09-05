---
lastmod: 2026-09-03 00:00:00.000000000 Z
title: Mises en page
description: Créez et personnalisez des mises en page pour le thème Jekyll Zer0-Mistakes.
preview: "/images/previews/layouts.png"
layout: default
categories:
- docs
- customization
tags:
- layouts
- templates
- jekyll
keywords:
- jekyll layouts
- liquid templates
- custom layouts
- layout hierarchy
- layout inheritance
difficulty: intermediate
estimated_reading_time: 15 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/customization/layouts/"
translation_of: pages/_docs/customization/layouts.md
translation_source_url: "/docs/customization/layouts/"
machine_translated: true
translated_from_sha: e61ed6fee085
---

# Mises en page

Les mises en page définissent la structure et l'apparence de vos pages. Le thème Zer0-Mistakes inclut plusieurs mises en page intégrées.

## Mises en page disponibles

| Mise en page | Objectif | Cas d'usage |
|--------|---------|----------|
| `default` | Page standard avec barre latérale | Documentation, pages générales |
| `article` | Mise en page d'article de blog | Articles de blog avec métadonnées |
| `home` | Mise en page de la page d'accueil | Page d'accueil du site |
| `collection` | Index de collection | Pages de listing pour les collections |
| `landing` | Page pleine largeur | Pages marketing/d'atterrissage |
| `root` | HTML de base | Ne pas utiliser directement |

## Utilisation des mises en page

Spécifiez une mise en page dans le front matter de votre page :

```yaml
---
title: "My Page"
layout: default
---
```

## Hiérarchie des mises en page

Les mises en page héritent les unes des autres :

```text
root.html                 # base HTML document — never use directly
├── default.html          # adds the sidebars and table of contents
│   ├── article.html      # blog posts
│   ├── collection.html   # collection index pages
│   ├── author.html  authors.html
│   ├── note.html    notebook.html
│   ├── recipe.html  cookbook.html
│   └── tag.html
├── home.html             # homepage
├── landing.html          # full-width marketing pages
├── section.html  news.html  admin.html  stats.html
└── 404.html      setup.html  welcome.html  book*.html
```

**La branche sur laquelle se trouve une mise en page n'est pas cosmétique.** `default.html` est la seule mise en page qui affiche la barre latérale gauche (`#bdSidebar`) et le panneau de table des matières (`#tocContents`). Une mise en page qui hérite directement de `root` n'obtient ni l'un ni l'autre — donc une mise en page personnalisée qui en a besoin doit hériter de `default`.

## Création de mises en page personnalisées

### Étape 1 : Créer le fichier de mise en page

Créez un fichier dans `_layouts/` :

```html
{% raw %}---
layout: default
---
<!-- _layouts/tutorial.html -->
<article class="tutorial">
  <header class="tutorial-header">
    <h1>{{ page.title }}</h1>
    <div class="meta">
      <span class="difficulty">{{ page.difficulty }}</span>
      <span class="time">{{ page.estimated_time }}</span>
    </div>
  </header>
  
  <div class="tutorial-content">
    {{ content }}
  </div>
  
  {% if page.next_tutorial %}
  <footer class="tutorial-footer">
    <a href="{{ page.next_tutorial }}">Next Tutorial →</a>
  </footer>
  {% endif %}
</article>{% endraw %}
```

### Étape 2 : Utiliser la mise en page

```yaml
---
title: "Getting Started Tutorial"
layout: tutorial
difficulty: beginner
estimated_reading_time: "15 minutes"
next_tutorial: /tutorials/part-2/
---
```

## Variables de mise en page

Accédez à ces variables dans vos mises en page :

| Variable | Description |
|----------|-------------|
| {% raw %}`{{ content }}`{% endraw %} | Contenu de la page (requis) |
| {% raw %}`{{ page.title }}`{% endraw %} | Titre de la page |
| {% raw %}`{{ page.description }}`{% endraw %} | Description de la page |
| {% raw %}`{{ page.layout }}`{% endraw %} | Nom de la mise en page actuelle |
| {% raw %}`{{ page.url }}`{% endraw %} | URL de la page |
| {% raw %}`{{ site.title }}`{% endraw %} | Titre du site |

## Remplacement des mises en page du thème

Pour personnaliser une mise en page du thème :

1. Copiez la mise en page du thème dans votre répertoire `_layouts/`
2. Modifiez selon vos besoins
3. Jekyll utilise votre version à la place

## Contenu conditionnel

Affichez du contenu selon la mise en page ou les variables de page :

```html
{% raw %}{% if page.layout == 'article' %}
  <div class="post-meta">
    <time>{{ page.date | date: "%B %d, %Y" }}</time>
    <span class="author">{{ page.author }}</span>
  </div>
{% endif %}

{% if page.sidebar %}
  {% include navigation/sidebar.html %}
{% endif %}{% endraw %}
```

## Inclusion de composants

Utilisez des includes pour les parties réutilisables :

```html
{% raw %}{% include core/head.html %}
{% include navigation/header.html %}
{% include content/toc.html %}
{% include core/footer.html %}{% endraw %}
```

## Bonnes pratiques

1. **Commencez avec `default`** — Héritez de default pour la cohérence
2. **Gardez des mises en page ciblées** — Chaque mise en page doit avoir un seul objectif
3. **Utilisez des includes** — Extrayez les composants réutilisables
4. **Documentez les mises en page personnalisées** — Notez l'objectif et les variables requises
5. **Testez la réactivité** — Vérifiez que les mises en page fonctionnent sur toutes les tailles d'écran

## Référence

- [Documentation des mises en page Jekyll](https://jekyllrb.com/docs/layouts/)
- [Langage de template Liquid](https://shopify.github.io/liquid/)
- [Maîtrise de CSS Grid (tutoriel)](/posts/2025/01/23/css-grid-mastery/) — créez des mises en page bidimensionnelles personnalisées avec des exemples interactifs dans le navigateur

## Référence technique

Pour les détails de niveau contributeur (hiérarchie des mises en page, héritage des templates Liquid, câblage de la barre latérale) :

- [Mises en page et navigation → docs/ui/layouts-and-navigation.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/ui/layouts-and-navigation.md)

## Voir aussi

- [[Customization]]
- [[Include Components]]
- [[Liquid]]
