---
lastmod: 2026-06-22 12:00:00.000000000 Z
title: Mises en page
description: Créez et personnalisez les mises en page des pages dans le thème Jekyll
  Zer0-Mistakes.
preview: "/images/previews/layouts.png"
layout: default
categories:
- docs
- customization
tags:
- layouts
- templates
- jekyll
difficulty: intermediate
estimated_reading_time: 15 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/customization/layouts/"
translation_of: pages/_docs/customization/layouts.md
translation_source_url: "/docs/customization/layouts/"
machine_translated: true
translated_from_sha: edeb35201153
---

# Mises en page

Les mises en page définissent la structure et l'apparence de vos pages. Le thème Zer0-Mistakes inclut plusieurs mises en page intégrées.

## Mises en page disponibles

| Mise en page | Objectif | Cas d'usage |
|--------|---------|----------|
| `default` | Page standard avec barre latérale | Documentation, pages générales |
| `journals` | Mise en page d'article de blog | Articles de blog avec métadonnées |
| `home` | Mise en page de page d'accueil | Page d'accueil du site |
| `collection` | Index de collection | Pages de liste pour les collections |
| `landing` | Page pleine largeur | Pages marketing/d'atterrissage |
| `root` | HTML de base | Ne pas utiliser directement |

## Utiliser les mises en page

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
root.html
└── default.html
    ├── home.html
    ├── journals.html
    ├── collection.html
    └── landing.html
```

## Créer des mises en page personnalisées

### Étape 1 : Créer le fichier de mise en page

Créez un fichier dans `_layouts/` :

```html
---
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
</article>
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
| `⟦8⟧` | Contenu de la page (obligatoire) |
| `⟦10⟧` | Titre de la page |
| `⟦12⟧` | Description de la page |
| `⟦14⟧` | Nom de la mise en page actuelle |
| `⟦16⟧` | URL de la page |
| `⟦18⟧` | Titre du site |

## Remplacer les mises en page du thème

Pour personnaliser une mise en page du thème :

1. Copiez la mise en page du thème vers votre répertoire `_layouts/`
2. Modifiez selon vos besoins
3. Jekyll utilise votre version à la place

## Contenu conditionnel

Affichez du contenu en fonction de la mise en page ou des variables de page :

```html
{% raw %}{% if page.layout == 'journals' %}
  <div class="post-meta">
    <time>{{ page.date | date: "%B %d, %Y" }}</time>
    <span class="author">{{ page.author }}</span>
  </div>
{% endif %}

{% if page.sidebar %}
  {% include navigation/sidebar.html %}
{% endif %}{% endraw %}
```

## Inclure des composants

Utilisez les includes pour les parties réutilisables :

```html
{% raw %}{% include core/head.html %}
{% include navigation/header.html %}
{% include content/toc.html %}
{% include core/footer.html %}{% endraw %}
```

## Bonnes pratiques

1. **Commencez avec `default`** — Héritez de default pour la cohérence
2. **Gardez les mises en page ciblées** — Chaque mise en page doit avoir un seul objectif
3. **Utilisez les includes** — Extrayez les composants réutilisables
4. **Documentez les mises en page personnalisées** — Notez l'objectif et les variables requises
5. **Testez la réactivité** — Vérifiez que les mises en page fonctionnent sur toutes les tailles d'écran

## Référence

- [Documentation des mises en page Jekyll](https://jekyllrb.com/docs/layouts/)
- [Langage de template Liquid](https://shopify.github.io/liquid/)
- [Maîtrise de CSS Grid (tutoriel)](/posts/2025/01/23/css-grid-mastery/) — créez des mises en page bidimensionnelles personnalisées avec des exemples interactifs dans le navigateur

## Référence technique

Pour les détails destinés aux contributeurs (hiérarchie des mises en page, héritage des templates Liquid, câblage de la barre latérale) :

- [Mises en page et navigation → docs/ui/layouts-and-navigation.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/ui/layouts-and-navigation.md)

## Voir aussi

- [[Customization]]
- [[Include Components]]
- [[Liquid]]
