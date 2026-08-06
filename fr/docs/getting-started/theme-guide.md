---
lastmod: 2026-06-14 00:00:00.000000000 Z
title: 'Guide du thème Jekyll : configuration, personnalisation, déploiement'
description: Guide complet pour utiliser et personnaliser le thème Jekyll Zer0-Mistakes
  avec un développement axé sur Docker, Bootstrap 5 et des intégrations modernes.
keywords:
- jekyll theme guide
- zer0-mistakes
- docker jekyll
- bootstrap 5 theme
- github pages theme
preview: "/images/previews/jekyll-theme-guide.png"
layout: default
categories:
- docs
- getting-started
tags:
- jekyll
- tutorial
- customization
- docker
- bootstrap
difficulty: beginner
estimated_reading_time: 30 minutes
prerequisites:
- Docker Desktop installed
- Basic command line knowledge
- Text editor (VS Code recommended)
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/getting-started/theme-guide/"
translation_of: pages/_docs/getting-started/theme-guide.md
translation_source_url: "/docs/getting-started/theme-guide/"
machine_translated: true
translated_from_sha: 446d47041206
---

# Guide du thème Jekyll

> Guide complet du thème Jekyll Zer0-Mistakes — de l'installation à la personnalisation jusqu'au déploiement.

## Aperçu

Le thème Zer0-Mistakes est un thème Jekyll orienté Docker avec :

- **Bootstrap 5.3** — Framework d'interface moderne et responsive
- **Commentaires Giscus** — Commentaires propulsés par GitHub Discussions
- **Analytics PostHog** — Analytique respectueuse de la vie privée
- **Diagrammes Mermaid** — Création de diagrammes basée sur du texte
- **MathJax** — Notation mathématique
- **Compatible GitHub Pages** — Fonctionne avec l'hébergement gratuit de GitHub

## Démarrage rapide

### Avec Docker (recommandé)

```bash
# Clone the repository
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes

# Start development server
docker-compose up

# Site available at http://localhost:4000
```

### Avec Ruby (alternative)

```bash
# Install dependencies
bundle install

# Start development server
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"
```

---

## Structure du projet

```text
zer0-mistakes/
├── _config.yml          # Production configuration
├── _config_dev.yml      # Development overrides
├── _layouts/            # Page templates
│   ├── root.html        # Base HTML structure
│   ├── default.html     # Main wrapper
│   ├── journals.html    # Blog posts
│   └── home.html        # Homepage
├── _includes/           # Reusable components
│   ├── core/            # head, header, footer
│   ├── content/         # giscus, toc, seo
│   ├── analytics/       # posthog, google
│   └── navigation/      # sidebar, breadcrumbs
├── _sass/               # Stylesheets
├── assets/              # Static files
│   ├── css/
│   ├── js/
│   └── images/
├── pages/               # Content collections
│   ├── _posts/          # Blog posts
│   └── _docs/           # Documentation
└── docker-compose.yml   # Docker configuration
```

---

## Configuration

### Système de configuration dual

Le thème utilise deux fichiers de configuration :

| Fichier | Objectif | Cas d'usage |
|------|---------|-----------|
| `_config.yml` | Paramètres de production | GitHub Pages, Netlify |
| `_config_dev.yml` | Surcharges de développement | Développement local |

**Production** (`_config.yml`) :

```yaml
remote_theme: "bamr87/zer0-mistakes"
posthog:
  enabled: true
```

**Développement** (`_config_dev.yml`) :

```yaml
remote_theme: false
posthog:
  enabled: false
show_drafts: true
```

### Principales options de configuration

```yaml
# Site Settings
title: "Your Site Title"
description: "Site description for SEO"
preview: /images/previews/jekyll-theme-guide.png
url: "https://yourdomain.com"
baseurl: ""  # Subpath, e.g., /blog

# Author
author:
  name: "Your Name"
  email: "you@example.com"
  bio: "About the author"

# Features
giscus:
  enabled: true
  data-repo-id: "YOUR_REPO_ID"
  data-category-id: "YOUR_CATEGORY_ID"

posthog:
  enabled: true
  api_key: "YOUR_API_KEY"

mermaid:
  src: '/assets/vendor/mermaid/mermaid.min.js'
```

---

## Créer du contenu

### Articles de blog

Créez des articles dans `pages/_posts/` selon la convention de nommage :

```text
YYYY-MM-DD-title-slug.md
```

**Exemple de front matter :**

```yaml
---
title: "My Blog Post"
description: "A brief description (150-160 chars)"
preview: /images/previews/jekyll-theme-guide.png
date: 2026-01-24T10:00:00.000Z
layout: article
categories: [Category, Subcategory]
tags: [tag1, tag2, tag3]
author: "Your Name"
permalink: /blog/my-post/
---

Your content here...
```

### Pages de documentation

Créez des docs dans `pages/_docs/` :

```yaml
---
title: "Documentation Page"
description: "What this page covers"
preview: /images/previews/jekyll-theme-guide.png
layout: default
permalink: /docs/section/page-name/
difficulty: beginner
estimated_reading_time: "10 minutes"
---
```

### Collections

Collections personnalisées dans `_config.yml` :

```yaml
collections:
  docs:
    output: true
    permalink: /docs/:path/
  tutorials:
    output: true
    permalink: /tutorials/:path/
```

---

## Templating Liquid

### Filtrage et tri

```liquid
{% raw %}{% comment %} Filter posts by category {% endcomment %}
{% assign posts = site.posts | where: "categories", "Tutorial" %}

{% comment %} Sort by date, newest first {% endcomment %}
{% assign posts = site.posts | sort: "date" | reverse %}

{% comment %} Limit results {% endcomment %}
{% assign recent = site.posts | limit: 5 %}{% endraw %}
```

### Conditions

```liquid
{% raw %}{% if page.layout == 'journals' %}
  <div class="post-meta">
    <time datetime="{{ page.date | date: '%Y-%m-%d' }}">
      {{ page.date | date: '%B %d, %Y' }}
    </time>
  </div>
{% endif %}{% endraw %}
```

### Boucles

```liquid
{% raw %}{% for post in site.posts limit:10 %}
  <article>
    <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
    <p>{{ post.excerpt | strip_html | truncate: 150 }}</p>
  </article>
{% endfor %}{% endraw %}
```

### Valeurs par défaut sûres

```liquid
{% raw %}{{ page.title | default: "Untitled" }}
{{ page.description | default: site.description }}
{{ page.author | default: site.author.name }}{% endraw %}
```

---

## Coloration syntaxique du code

### Configuration

Le thème utilise Kramdown avec Rouge pour la coloration syntaxique :

```yaml
# _config.yml
markdown: kramdown
highlighter: rouge

kramdown:
  input: GFM
  syntax_highlighter: rouge
```

### Utilisation

Indiquez le langage après le délimiteur d'ouverture :

````markdown
```python
def hello_world():
    print("Hello, World!")
```
````

**Langages pris en charge :** Ruby, Python, JavaScript, HTML, CSS, YAML, JSON, Bash, et [bien d'autres](https://github.com/rouge-ruby/rouge/wiki/List-of-supported-languages-and-lexers).

---

## Liens et références

### Liens internes

Utilisez la balise `link` pour des liens internes validés :

```liquid
{% raw %}[View Documentation]({% link pages/_docs/getting-started.md %})
[Read Post]({% link pages/_posts/2026-01-24-my-post.md %}){% endraw %}
```

**Avantages :**

- La construction échoue si la cible du lien n'existe pas
- Gère automatiquement les changements d'URL

### Liens externes

Ouvrez dans un nouvel onglet avec `target="_blank"` :

```markdown
[External Site](https://example.com){:target="_blank" rel="noopener"}
```

### URLs relatives

```liquid
{% raw %}<a href="{{ '/about/' | relative_url }}">About</a>
<img src="{{ '/assets/images/logo.png' | relative_url }}" alt="Logo">{% endraw %}
```

---

## Personnalisation

### Layouts

Créez des layouts personnalisés dans `_layouts/` :

```html
---
layout: default
---
{% raw %}<article class="custom-layout">
  <header>
    <h1>{{ page.title }}</h1>
  </header>
  <div class="content">
    {{ content }}
  </div>
</article>{% endraw %}
```

### Includes

Créez des composants réutilisables dans `_includes/` :

```html
{% raw %}<!-- _includes/components/alert.html -->
<div class="alert alert-{{ include.type | default: 'info' }}">
  {{ include.message }}
</div>{% endraw %}
```

**Utilisation :**

```liquid
{% raw %}{% include components/alert.html type="warning" message="Important notice!" %}{% endraw %}
```

### Styles

Ajoutez des styles personnalisés dans `_sass/custom.scss` :

```scss
// Custom variables
$primary-color: #007bff;

// Custom styles
.my-component {
  background: $primary-color;
  padding: 1rem;
  border-radius: 0.5rem;
}
```

---

## Référence des fonctionnalités

| Fonctionnalité | Documentation | Front Matter |
|---------|---------------|--------------|
| Commentaires | [Guide Giscus](/docs/features/giscus-comments/) | `comments: true` |
| Analytique | [Guide PostHog](/docs/features/posthog-analytics/) | (auto) |
| Diagrammes | [Guide Mermaid](/docs/features/mermaid-diagrams/) | `mermaid: true` |
| Mathématiques | [Guide MathJax](/docs/features/mathjax-math/) | `mathjax: true` |
| Pagination | [Guide de pagination](/docs/jekyll/pagination/) | (auto) |

---

## Déploiement

### GitHub Pages

1. Poussez vers le dépôt GitHub
2. Allez dans Settings → Pages
3. Sélectionnez la branche source (généralement `main`)
4. Le site se déploie automatiquement

### Netlify

1. Connectez le dépôt à Netlify
2. Commande de build : `jekyll build`
3. Répertoire de publication : `_site`
4. Ajoutez `netlify.toml` pour les en-têtes/redirections

### Domaine personnalisé

Consultez [Configuration d'un domaine personnalisé](/docs/deployment/custom-domain/).

---

## Dépannage

### Problèmes Docker

```bash
# Rebuild containers
docker-compose down && docker-compose up --build

# View logs
docker-compose logs -f jekyll

# Access container shell
docker-compose exec jekyll bash
```

### Erreurs de build

```bash
# Check Jekyll configuration
bundle exec jekyll doctor

# Build with verbose output
bundle exec jekyll build --verbose --trace

# Clear cache
bundle exec jekyll clean
```

### Problèmes courants

| Problème | Solution |
|-------|----------|
| Port 4000 utilisé | Utilisez `--port 4001` ou arrêtez les autres processus |
| Gem introuvable | Exécutez `bundle install` |
| Styles non mis à jour | Videz le cache du navigateur, exécutez `jekyll clean` |
| Layout introuvable | Vérifiez que `layout:` dans le front matter correspond au nom de fichier |

---

## Étapes suivantes

- **[Commentaires Giscus](/docs/features/giscus-comments/)** — Ajoutez une fonctionnalité de commentaires
- **[Analytique PostHog](/docs/features/posthog-analytics/)** — Suivez l'utilisation du site
- **[Diagrammes Mermaid](/docs/features/mermaid-diagrams/)** — Créez une documentation visuelle
- **[Navigation au clavier](/docs/features/keyboard-navigation/)** — Fonctionnalités d'accessibilité

---

*Ce guide fait partie de la documentation du [thème Jekyll Zer0-Mistakes](https://github.com/bamr87/zer0-mistakes).*

## Voir aussi

- [[Getting Started]]
- [[Customization]]
- [[Features]]
- [[Bootstrap Integration]]
