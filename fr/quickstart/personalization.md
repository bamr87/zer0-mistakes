---
title: Personnalisation et configuration du site
author: Zer0-Mistakes Development Team
layout: default
description: Personnalisez votre site Jekyll grâce à des formulaires interactifs.
  Configurez l'identité du site, l'image de marque, l'analytique, les liens sociaux
  et générez votre fichier _config.yml complet.
preview: "/images/previews/site-personalization-configuration.png"
categories:
- Documentation
- Quick Start
tags:
- jekyll
- configuration
- personalization
- customization
- yaml
keywords:
  primary:
  - jekyll configuration
  - site personalization
  secondary:
  - yaml config
  - site branding
  - analytics setup
  - social links
lastmod: 2026-05-30 00:00:00.000000000 Z
draft: false
sidebar:
  nav: quickstart
quickstart:
  step: 4
  next:
  prev: "/quickstart/github-setup/"
lang: fr
permalink: "/fr/quickstart/personalization/"
translation_of: pages/_quickstart/personalization.md
translation_source_url: "/quickstart/personalization/"
machine_translated: true
translated_from_sha: 630342fcd530
---

# 🎨 Personnalisation et configuration du site

Après avoir terminé l'[installation Quick Start](/quickstart/), utilisez ce guide pour personnaliser votre site Jekyll. Remplissez les formulaires interactifs ci-dessous pour générer vos paramètres `_config.yml` personnalisés.

> **Vous préférez une interface en direct ?** Le [Theme Customizer](/about/settings/theme/) vous permet de prévisualiser en temps réel les changements de skin et de couleur directement sur votre site en cours d'exécution.

![Theme Customizer — aperçu du skin et des couleurs](/assets/images/quickstart/06-theme-customizer.png)

![Formulaire de configuration de personnalisation](/assets/images/quickstart/personalization-config.png)

<div class="alert alert-info mb-4" role="alert">
  <i class="bi bi-info-circle-fill"></i> <strong>Comment ça fonctionne</strong>
  <p class="mb-0 mt-2">Remplissez les formulaires de chaque section. Vos paramètres seront automatiquement enregistrés et combinés en un fichier <code>_config.yml</code> complet en bas de la page. Copiez-collez pour personnaliser votre site !</p>
</div>

## 📋 Sections de configuration

<div class="row g-3 mb-4">
  <div class="col-md-4">
    <a href="#site-identity" class="text-decoration-none">
      <div class="card h-100 border-primary">
        <div class="card-body text-center">
          <i class="bi bi-globe fs-1 text-primary"></i>
          <h5 class="card-title mt-2">Identité du site</h5>
          <p class="card-text text-muted small">Titre, description, URL</p>
        </div>
      </div>
    </a>
  </div>
  <div class="col-md-4">
    <a href="#owner-info" class="text-decoration-none">
      <div class="card h-100 border-success">
        <div class="card-body text-center">
          <i class="bi bi-person-circle fs-1 text-success"></i>
          <h5 class="card-title mt-2">Infos du propriétaire</h5>
          <p class="card-text text-muted small">Nom, bio, contact</p>
        </div>
      </div>
    </a>
  </div>
  <div class="col-md-4">
    <a href="#social-links" class="text-decoration-none">
      <div class="card h-100 border-info">
        <div class="card-body text-center">
          <i class="bi bi-share fs-1 text-info"></i>
          <h5 class="card-title mt-2">Liens sociaux</h5>
          <p class="card-text text-muted small">GitHub, Twitter, et plus</p>
        </div>
      </div>
    </a>
  </div>
  <div class="col-md-4">
    <a href="#appearance" class="text-decoration-none">
      <div class="card h-100 border-warning">
        <div class="card-body text-center">
          <i class="bi bi-palette fs-1 text-warning"></i>
          <h5 class="card-title mt-2">Apparence</h5>
          <p class="card-text text-muted small">Thème, couleurs, logo</p>
        </div>
      </div>
    </a>
  </div>
  <div class="col-md-4">
    <a href="#analytics" class="text-decoration-none">
      <div class="card h-100 border-danger">
        <div class="card-body text-center">
          <i class="bi bi-graph-up fs-1 text-danger"></i>
          <h5 class="card-title mt-2">Analytique</h5>
          <p class="card-text text-muted small">Suivi Google, PostHog</p>
        </div>
      </div>
    </a>
  </div>
  <div class="col-md-4">
    <a href="#advanced" class="text-decoration-none">
      <div class="card h-100 border-secondary">
        <div class="card-body text-center">
          <i class="bi bi-gear fs-1 text-secondary"></i>
          <h5 class="card-title mt-2">Avancé</h5>
          <p class="card-text text-muted small">Plugins, collections</p>
        </div>
      </div>
    </a>
  </div>
</div>

---

<h2 id="site-identity"><i class="bi bi-globe text-primary"></i> Identité du site</h2>

Configurez les informations de base qui identifient votre site sur le web.

<div class="card mb-4">
  <div class="card-header bg-primary text-white">
    <i class="bi bi-info-circle"></i> <strong>Informations de base du site</strong>
  </div>
  <div class="card-body">
    <form id="site-identity-form">
      <div class="row g-3">
        <div class="col-md-6">
          <label for="cfg-title" class="form-label"><i class="bi bi-type-h1"></i> Titre du site <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="cfg-title" placeholder="My Awesome Site" required>
          <div class="form-text">Le titre principal affiché dans les onglets du navigateur et les en-têtes</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-subtitle" class="form-label"><i class="bi bi-type-h3"></i> Sous-titre/Slogan</label>
          <input type="text" class="form-control" id="cfg-subtitle" placeholder="A developer's blog">
          <div class="form-text">Court slogan affiché sous le titre</div>
        </div>
        <div class="col-12">
          <label for="cfg-description" class="form-label"><i class="bi bi-text-paragraph"></i> Description du site <span class="text-danger">*</span></label>
          <textarea class="form-control" id="cfg-description" rows="3" placeholder="A Jekyll site powered by the zer0-mistakes theme. Step-by-step guides and tutorials for developers." required></textarea>
          <div class="form-text">Description SEO (150-160 caractères recommandés)</div>
          <small class="text-muted"><span id="desc-char-count">0</span>/160 caractères</small>
        </div>
        <div class="col-md-6">
          <label for="cfg-domain" class="form-label"><i class="bi bi-link-45deg"></i> Nom de domaine</label>
          <div class="input-group">
            <span class="input-group-text">https://</span>
            <input type="text" class="form-control" id="cfg-domain" placeholder="mysite.com">
          </div>
          <div class="form-text">Votre domaine personnalisé (laissez vide pour la valeur par défaut de GitHub Pages)</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-baseurl" class="form-label"><i class="bi bi-folder"></i> URL de base</label>
          <div class="input-group">
            <span class="input-group-text">/</span>
            <input type="text" class="form-control" id="cfg-baseurl" placeholder="">
          </div>
          <div class="form-text">Sous-chemin pour les sites de projet (par ex., "blog" pour /blog/)</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-locale" class="form-label"><i class="bi bi-translate"></i> Langue/Paramètres régionaux</label>
          <select class="form-select" id="cfg-locale">
            <option value="en-US" selected>Anglais (US)</option>
            <option value="en-GB">Anglais (UK)</option>
            <option value="es-ES">Español</option>
            <option value="fr-FR">Français</option>
            <option value="de-DE">Deutsch</option>
            <option value="ja-JP">日本語</option>
            <option value="zh-CN">中文 (简体)</option>
            <option value="pt-BR">Português (Brasil)</option>
          </select>
          <div class="form-text">Langue principale de votre site</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-title-separator" class="form-label"><i class="bi bi-dash-lg"></i> Séparateur de titre</label>
          <select class="form-select" id="cfg-title-separator">
            <option value="|" selected>| (Barre verticale)</option>
            <option value="-">- (Tiret)</option>
            <option value="·">· (Point médian)</option>
            <option value="—">— (Tiret cadratin)</option>
            <option value="»">» (Guillemet)</option>
          </select>
          <div class="form-text">Séparateur affiché dans l'onglet du navigateur (Titre de la page | Nom du site)</div>
        </div>
      </div>
    </form>
  </div>
</div>

---

<h2 id="owner-info"><i class="bi bi-person-circle text-success"></i> Informations du propriétaire</h2>

Configurez votre identité personnelle ou organisationnelle.

<div class="card mb-4">
  <div class="card-header bg-success text-white">
    <i class="bi bi-person-badge"></i> <strong>Détails de l'auteur et du propriétaire</strong>
  </div>
  <div class="card-body">
    <form id="owner-info-form">
      <div class="row g-3">
        <div class="col-md-6">
          <label for="cfg-author-name" class="form-label"><i class="bi bi-person"></i> Votre nom <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="cfg-author-name" placeholder="John Doe" required>
          <div class="form-text">Nom affiché pour les crédits d'auteur</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-email" class="form-label"><i class="bi bi-envelope"></i> Adresse e-mail</label>
          <input type="email" class="form-control" id="cfg-email" placeholder="hello@example.com">
          <div class="form-text">E-mail de contact (facultatif, affiché dans le pied de page)</div>
        </div>
        <div class="col-12">
          <label for="cfg-bio" class="form-label"><i class="bi bi-chat-quote"></i> Bio</label>
          <textarea class="form-control" id="cfg-bio" rows="2" placeholder="Developer, blogger, and tech enthusiast"></textarea>
          <div class="form-text">Courte biographie affichée sur le profil de l'auteur</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-location" class="form-label"><i class="bi bi-geo-alt"></i> Localisation</label>
          <input type="text" class="form-control" id="cfg-location" placeholder="San Francisco, CA">
          <div class="form-text">Ville, Région/Pays (affiché sur le profil)</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-avatar" class="form-label"><i class="bi bi-image"></i> URL de l'avatar</label>
          <input type="url" class="form-control" id="cfg-avatar" placeholder="/assets/images/avatar.png">
          <div class="form-text">Chemin vers l'image de profil (local ou URL)</div>
        </div>
      </div>
    </form>
  </div>
</div>

---

<h2 id="social-links"><i class="bi bi-share text-info"></i> Liens sociaux</h2>

Connectez vos profils sociaux et comptes externes.

<div class="card mb-4">
  <div class="card-header bg-info text-white">
    <i class="bi bi-people"></i> <strong>Réseaux sociaux et profils</strong>
  </div>
  <div class="card-body">
    <form id="social-links-form">
      <div class="row g-3">
        <div class="col-md-6">
          <label for="cfg-github" class="form-label"><i class="bi bi-github"></i> Nom d'utilisateur GitHub</label>
          <div class="input-group">
            <span class="input-group-text">github.com/</span>
            <input type="text" class="form-control" id="cfg-github" placeholder="username">
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-twitter" class="form-label"><i class="bi bi-twitter-x"></i> Nom d'utilisateur Twitter/X</label>
          <div class="input-group">
            <span class="input-group-text">@</span>
            <input type="text" class="form-control" id="cfg-twitter" placeholder="username">
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-linkedin" class="form-label"><i class="bi bi-linkedin"></i> Profil LinkedIn</label>
          <div class="input-group">
            <span class="input-group-text">linkedin.com/in/</span>
            <input type="text" class="form-control" id="cfg-linkedin" placeholder="username">
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-instagram" class="form-label"><i class="bi bi-instagram"></i> Nom d'utilisateur Instagram</label>
          <div class="input-group">
            <span class="input-group-text">@</span>
            <input type="text" class="form-control" id="cfg-instagram" placeholder="username">
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-youtube" class="form-label"><i class="bi bi-youtube"></i> Chaîne YouTube</label>
          <input type="url" class="form-control" id="cfg-youtube" placeholder="https://youtube.com/@channel">
          <div class="form-text">URL complète vers votre chaîne</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-mastodon" class="form-label"><i class="bi bi-mastodon"></i> Profil Mastodon</label>
          <input type="url" class="form-control" id="cfg-mastodon" placeholder="https://mastodon.social/@username">
          <div class="form-text">URL complète incluant l'instance</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-bluesky" class="form-label"><i class="bi bi-cloud"></i> Identifiant Bluesky</label>
          <div class="input-group">
            <span class="input-group-text">@</span>
            <input type="text" class="form-control" id="cfg-bluesky" placeholder="username.bsky.social">
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-discord" class="form-label"><i class="bi bi-discord"></i> Serveur Discord</label>
          <input type="url" class="form-control" id="cfg-discord" placeholder="https://discord.gg/invite-code">
          <div class="form-text">Lien d'invitation vers votre serveur</div>
        </div>
      </div>
    </form>
  </div>
</div>

---

<h2 id="appearance"><i class="bi bi-palette text-warning"></i> Apparence et image de marque</h2>

Personnalisez l'apparence et l'ambiance de votre site.

<div class="card mb-4">
  <div class="card-header bg-warning text-dark">
    <i class="bi bi-brush"></i> <strong>Thème et paramètres visuels</strong>
  </div>
  <div class="card-body">
    <form id="appearance-form">
      <div class="row g-3">
        <div class="col-md-6">
          <label for="cfg-theme-skin" class="form-label"><i class="bi bi-moon-stars"></i> Habillage du thème</label>
          <select class="form-select" id="cfg-theme-skin">
            <option value="dark" selected>Sombre</option>
            <option value="air">Air (Clair)</option>
            <option value="aqua">Aqua</option>
            <option value="contrast">Contraste élevé</option>
            <option value="dirt">Dirt</option>
            <option value="neon">Neon</option>
            <option value="mint">Mint</option>
            <option value="plum">Plum</option>
            <option value="sunrise">Sunrise</option>
          </select>
          <div class="form-text">Palette de couleurs de votre site</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-primary-color" class="form-label"><i class="bi bi-droplet-fill"></i> Couleur principale</label>
          <div class="input-group">
            <input type="color" class="form-control form-control-color" id="cfg-primary-color-picker" value="#007bff">
            <input type="text" class="form-control" id="cfg-primary-color" value="#007bff" pattern="^#[0-9A-Fa-f]{6}$">
          </div>
          <div class="form-text">Couleur d'accentuation principale pour les boutons et les liens</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-logo" class="form-label"><i class="bi bi-image"></i> Chemin du logo</label>
          <input type="text" class="form-control" id="cfg-logo" placeholder="/assets/images/logo.png">
          <div class="form-text">Chemin vers l'image du logo (88x88px recommandé)</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-og-image" class="form-label"><i class="bi bi-card-image"></i> Image sociale par défaut</label>
          <input type="text" class="form-control" id="cfg-og-image" placeholder="/assets/images/og-image.png">
          <div class="form-text">Image par défaut pour le partage sur les réseaux sociaux (1200x630px)</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-teaser" class="form-label"><i class="bi bi-image"></i> Image d'aperçu</label>
          <input type="text" class="form-control" id="cfg-teaser" placeholder="/assets/images/teaser.png">
          <div class="form-text">Image de repli pour les articles sans aperçu</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-wpm" class="form-label"><i class="bi bi-speedometer2"></i> Mots par minute</label>
          <input type="number" class="form-control" id="cfg-wpm" value="200" min="100" max="400">
          <div class="form-text">Vitesse de lecture pour les estimations « X min de lecture »</div>
        </div>
        <div class="col-12">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-breadcrumbs" checked>
            <label class="form-check-label" for="cfg-breadcrumbs">
              <i class="bi bi-signpost-split"></i> Afficher la navigation par fil d'Ariane
            </label>
          </div>
        </div>
      </div>
    </form>
  </div>
</div>

---

<h2 id="analytics"><i class="bi bi-graph-up text-danger"></i> Analytique et suivi</h2>

Mettez en place une analytique respectueuse de la vie privée pour comprendre votre audience.

<div class="card mb-4">
  <div class="card-header bg-danger text-white">
    <i class="bi bi-bar-chart-line"></i> <strong>Configuration de l'analytique</strong>
  </div>
  <div class="card-body">
    <form id="analytics-form">
      <div class="row g-3">
        <!-- Google Analytics -->
        <div class="col-12">
          <h6 class="border-bottom pb-2"><i class="bi bi-google"></i> Google Analytics</h6>
        </div>
        <div class="col-md-6">
          <label for="cfg-ga-id" class="form-label">ID de mesure</label>
          <input type="text" class="form-control" id="cfg-ga-id" placeholder="G-XXXXXXXXXX">
          <div class="form-text">ID de mesure Google Analytics 4</div>
        </div>
        
        <!-- PostHog Analytics -->
        <div class="col-12 mt-4">
          <h6 class="border-bottom pb-2"><i class="bi bi-speedometer"></i> PostHog Analytics (Respectueux de la vie privée)</h6>
        </div>
        <div class="col-12">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-posthog-enabled">
            <label class="form-check-label" for="cfg-posthog-enabled">
              Activer PostHog Analytics
            </label>
          </div>
        </div>
        <div class="col-md-6">
          <label for="cfg-posthog-key" class="form-label">Clé API PostHog</label>
          <input type="text" class="form-control" id="cfg-posthog-key" placeholder="phc_xxxxxxxxxxxxx">
          <div class="form-text">La clé API de votre projet PostHog</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-posthog-host" class="form-label">Hôte API PostHog</label>
          <input type="url" class="form-control" id="cfg-posthog-host" placeholder="https://us.i.posthog.com" value="https://us.i.posthog.com">
          <div class="form-text">URL de l'instance PostHog</div>
        </div>
        <div class="col-12">
          <p class="text-muted small mb-2">Options de confidentialité PostHog :</p>
          <div class="row g-2">
            <div class="col-md-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="cfg-posthog-dnt" checked>
                <label class="form-check-label" for="cfg-posthog-dnt">Respecter Do Not Track</label>
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="cfg-posthog-autocapture" checked>
                <label class="form-check-label" for="cfg-posthog-autocapture">Capture automatique des événements</label>
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="cfg-posthog-session">
                <label class="form-check-label" for="cfg-posthog-session">Enregistrement de session</label>
              </div>
            </div>
          </div>
        </div>

        <!-- Site Verification -->
        <div class="col-12 mt-4">
          <h6 class="border-bottom pb-2"><i class="bi bi-shield-check"></i> Vérification du site</h6>
        </div>
        <div class="col-md-6">
          <label for="cfg-google-verify" class="form-label">Vérification Google</label>
          <input type="text" class="form-control" id="cfg-google-verify" placeholder="verification_token">
          <div class="form-text">Vérification Google Search Console</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-bing-verify" class="form-label">Vérification Bing</label>
          <input type="text" class="form-control" id="cfg-bing-verify" placeholder="verification_token">
          <div class="form-text">Vérification Bing Webmaster Tools</div>
        </div>
      </div>
    </form>
  </div>
</div>

---

<h2 id="advanced"><i class="bi bi-gear text-secondary"></i> Paramètres avancés</h2>

Configurez des fonctionnalités avancées comme les commentaires, les plugins et les paramètres de build.

<div class="card mb-4">
  <div class="card-header bg-secondary text-white">
    <i class="bi bi-sliders"></i> <strong>Configuration avancée</strong>
  </div>
  <div class="card-body">
    <form id="advanced-form">
      <div class="row g-3">
        <!-- Comments -->
        <div class="col-12">
          <h6 class="border-bottom pb-2"><i class="bi bi-chat-dots"></i> Commentaires (Giscus)</h6>
        </div>
        <div class="col-12">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-giscus-enabled">
            <label class="form-check-label" for="cfg-giscus-enabled">
              Activer les commentaires Giscus (GitHub Discussions)
            </label>
          </div>
          <div class="form-text">Nécessite la <a href="https://giscus.app" target="_blank">configuration de Giscus</a> sur votre dépôt</div>
        </div>
        <div class="col-md-6">
          <label for="cfg-giscus-repo-id" class="form-label">ID du dépôt</label>
          <input type="text" class="form-control" id="cfg-giscus-repo-id" placeholder="R_xxxxxxxxxxxx">
        </div>
        <div class="col-md-6">
          <label for="cfg-giscus-category-id" class="form-label">ID de catégorie</label>
          <input type="text" class="form-control" id="cfg-giscus-category-id" placeholder="DIC_xxxxxxxxxxxx">
        </div>

        <!-- Jekyll Settings -->
        <div class="col-12 mt-4">
          <h6 class="border-bottom pb-2"><i class="bi bi-file-earmark-code"></i> Paramètres de build Jekyll</h6>
        </div>
        <div class="col-md-4">
          <label for="cfg-paginate" class="form-label">Articles par page</label>
          <input type="number" class="form-control" id="cfg-paginate" value="10" min="1" max="50">
          <div class="form-text">Pagination pour les listes d'articles</div>
        </div>
        <div class="col-md-4">
          <label for="cfg-port" class="form-label">Port du serveur de développement</label>
          <input type="number" class="form-control" id="cfg-port" value="4000" min="1024" max="65535">
          <div class="form-text">Port de développement local</div>
        </div>
        <div class="col-md-4">
          <label for="cfg-markdown" class="form-label">Moteur Markdown</label>
          <select class="form-select" id="cfg-markdown">
            <option value="kramdown" selected>Kramdown (recommandé)</option>
            <option value="commonmark">CommonMark</option>
          </select>
        </div>

        <!-- Features Toggle -->
        <div class="col-12 mt-4">
          <h6 class="border-bottom pb-2"><i class="bi bi-toggles"></i> Options de fonctionnalités</h6>
        </div>
        <div class="col-md-4">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-mermaid" checked>
            <label class="form-check-label" for="cfg-mermaid">Diagrammes Mermaid</label>
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-mathjax" checked>
            <label class="form-check-label" for="cfg-mathjax">Équations MathJax</label>
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="cfg-search" checked>
            <label class="form-check-label" for="cfg-search">Recherche sur le site</label>
          </div>
        </div>

        <!-- Copyright -->
        <div class="col-12 mt-4">
          <h6 class="border-bottom pb-2"><i class="bi bi-c-circle"></i> Droits d'auteur</h6>
        </div>
        <div class="col-md-4">
          <label for="cfg-cr-year" class="form-label">Année de début</label>
          <input type="number" class="form-control" id="cfg-cr-year" value="2024" min="2000" max="2100">
        </div>
        <div class="col-md-4">
          <label for="cfg-cr-entity" class="form-label">Titulaire des droits d'auteur</label>
          <input type="text" class="form-control" id="cfg-cr-entity" placeholder="Your Name">
        </div>
        <div class="col-md-4">
          <label for="cfg-cr-license" class="form-label">Licence</label>
          <select class="form-select" id="cfg-cr-license">
            <option value="MIT" selected>MIT</option>
            <option value="Apache-2.0">Apache 2.0</option>
            <option value="GPL-3.0">GPL 3.0</option>
            <option value="CC-BY-4.0">CC BY 4.0</option>
            <option value="CC-BY-SA-4.0">CC BY-SA 4.0</option>
            <option value="All Rights Reserved">Tous droits réservés</option>
          </select>
        </div>
      </div>
    </form>
  </div>
</div>

---

## 📝 Configuration générée

<div class="card mb-4 border-dark">
  <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
    <span><i class="bi bi-file-earmark-code"></i> <strong>Votre _config.yml</strong></span>
    <div>
      <button class="btn btn-sm btn-outline-light me-2" id="reset-all-btn">
        <i class="bi bi-arrow-counterclockwise"></i> Tout réinitialiser
      </button>
      <button class="btn btn-sm btn-success" id="copy-config-btn">
        <i class="bi bi-clipboard"></i> Copier la config
      </button>
    </div>
  </div>
  <div class="card-body p-0">
    <pre class="bg-dark text-light p-3 m-0 rounded-bottom" style="max-height: 500px; overflow-y: auto;"><code id="generated-config" class="language-yaml"># Chargement de la configuration...</code></pre>
  </div>
</div>

<div class="alert alert-success" role="alert">
  <i class="bi bi-check-circle-fill"></i> <strong>Étapes suivantes</strong>
  <ol class="mb-0 mt-2">
    <li>Copiez la configuration générée ci-dessus</li>
    <li>Collez-la dans votre fichier <code>_config.yml</code></li>
    <li>Redémarrez votre serveur Jekyll : <code>docker-compose restart</code></li>
    <li>Consultez votre site personnalisé à l'adresse <code>http://localhost:4000</code></li>
  </ol>
</div>

---

## 🎉 Tout est prêt !

Félicitations pour avoir terminé le guide de démarrage rapide ! Votre site est désormais :

- ✅ En cours d'exécution localement avec Docker
- ✅ Connecté à GitHub pour le contrôle de version
- ✅ Personnalisé avec votre identité visuelle
- ✅ Prêt pour le déploiement sur GitHub Pages

### Et ensuite ?

- **Créer du contenu** - Ajoutez des articles de blog dans `pages/_posts/`
- **Personnaliser les mises en page** - Modifiez les modèles dans `_layouts/` et `_includes/`
- **Déployer en production** - Poussez sur GitHub et activez GitHub Pages
- **Explorer la documentation** - Consultez la [documentation complète](/docs/)

---

## 📚 Résumé du guide de démarrage rapide

| Étape | Guide | Description |
|------|-------|-------------|
| 1 | **[Configuration de la machine](/quickstart/machine-setup/)** | Installer Docker, Git et les outils de développement |
| 2 | **[Configuration de Jekyll](/quickstart/jekyll-setup/)** | Démarrer le serveur de développement et créer du contenu |
| 3 | **[Configuration de GitHub](/quickstart/github-setup/)** | Contrôle de version et déploiement GitHub Pages |
| 4 | **[Personnalisation](/quickstart/personalization/)** | Personnaliser l'identité et la configuration du site |

---

<div class="d-flex justify-content-between mt-5">
  <a href="/quickstart/github-setup/" class="btn btn-outline-primary">
    <i class="bi bi-arrow-left"></i> Précédent : Configuration de GitHub
  </a>
  <a href="/quickstart/" class="btn btn-success">
    <i class="bi bi-check-circle"></i> Retour au démarrage rapide
  </a>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() { // Configuration state object const config = {
    site: {},
    owner: {},
    social: {},
    appearance: {},
    analytics: {},
    advanced: {}
  };

// Helper function to get input value safely function getValue(id, defaultValue = '') {
    const el = document.getElementById(id);
    if (!el) return defaultValue;
    if (el.type === 'checkbox') return el.checked;
    return el.value || defaultValue;
  }

// Update character count for description const descInput = document.getElementById('cfg-description'); const charCount = document.getElementById('desc-char-count'); if (descInput && charCount) {
    descInput.addEventListener('input', function() {
      charCount.textContent = this.value.length;
      charCount.className = this.value.length > 160 ? 'text-danger' : 'text-muted';
    });
  }

// Sync color picker with text input const colorPicker = document.getElementById('cfg-primary-color-picker'); const colorInput = document.getElementById('cfg-primary-color'); if (colorPicker && colorInput) {
    colorPicker.addEventListener('input', function() {
      colorInput.value = this.value;
      generateConfig();
    });
    colorInput.addEventListener('input', function() {
      if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
        colorPicker.value = this.value;
      }
      generateConfig();
    });
  }

// Generate YAML configuration function generateConfig() {
    const title = getValue('cfg-title', 'My Site');
    const subtitle = getValue('cfg-subtitle');
    const description = getValue('cfg-description', 'A Jekyll site powered by zer0-mistakes theme.');
    const domain = getValue('cfg-domain');
    const baseurl = getValue('cfg-baseurl');
    const locale = getValue('cfg-locale', 'en-US');
    const titleSeparator = getValue('cfg-title-separator', '|');
    
    const authorName = getValue('cfg-author-name', 'Site Owner');
    const email = getValue('cfg-email');
    const bio = getValue('cfg-bio');
    const location = getValue('cfg-location');
    const avatar = getValue('cfg-avatar');
    
    const github = getValue('cfg-github');
    const twitter = getValue('cfg-twitter');
    const linkedin = getValue('cfg-linkedin');
    const instagram = getValue('cfg-instagram');
    const youtube = getValue('cfg-youtube');
    const mastodon = getValue('cfg-mastodon');
    const bluesky = getValue('cfg-bluesky');
    const discord = getValue('cfg-discord');
    
    const themeSkin = getValue('cfg-theme-skin', 'dark');
    const primaryColor = getValue('cfg-primary-color', '#007bff');
    const logo = getValue('cfg-logo');
    const ogImage = getValue('cfg-og-image');
    const teaser = getValue('cfg-teaser');
    const wpm = getValue('cfg-wpm', '200');
    const breadcrumbs = getValue('cfg-breadcrumbs', true);
    
    const gaId = getValue('cfg-ga-id');
    const posthogEnabled = getValue('cfg-posthog-enabled', false);
    const posthogKey = getValue('cfg-posthog-key');
    const posthogHost = getValue('cfg-posthog-host', 'https://us.i.posthog.com');
    const posthogDnt = getValue('cfg-posthog-dnt', true);
    const posthogAutocapture = getValue('cfg-posthog-autocapture', true);
    const posthogSession = getValue('cfg-posthog-session', false);
    const googleVerify = getValue('cfg-google-verify');
    const bingVerify = getValue('cfg-bing-verify');
    
    const giscusEnabled = getValue('cfg-giscus-enabled', false);
    const giscusRepoId = getValue('cfg-giscus-repo-id');
    const giscusCategoryId = getValue('cfg-giscus-category-id');
    const paginate = getValue('cfg-paginate', '10');
    const port = getValue('cfg-port', '4000');
    const markdown = getValue('cfg-markdown', 'kramdown');
    const mermaid = getValue('cfg-mermaid', true);
    const mathjax = getValue('cfg-mathjax', true);
    const search = getValue('cfg-search', true);
    const crYear = getValue('cfg-cr-year', new Date().getFullYear().toString());
    const crEntity = getValue('cfg-cr-entity', authorName);
    const crLicense = getValue('cfg-cr-license', 'MIT');

    let yaml = `# =========================================================================
# Zer0-Mistakes Jekyll Theme - Configuration du site
# Généré : ${new Date().toISOString().split('T')[0]}
# Docs : https://bamr87.github.io/zer0-mistakes/
# =========================================================================

# Paramètres du site
# -------------------------------------------------------------------------
remote_theme: "bamr87/zer0-mistakes"

title: "${escapeYaml(title)}"`;

    if (subtitle) yaml += `\nsubtitle: "${escapeYaml(subtitle)}"`;
    
    yaml += `
title_separator: "${titleSeparator}" description: >- ${escapeYaml(description)} locale: "${locale}"`;

    if (domain) yaml += `\nurl: "https://${escapeYaml(domain)}"`;
    if (baseurl) yaml += `\nbaseurl: "/${escapeYaml(baseurl)}"`;
    yaml += `\nport: ${port}`;

    // Informations sur le propriétaire/auteur
    yaml += `

# Informations sur le propriétaire
# -------------------------------------------------------------------------
name: "${escapeYaml(authorName)}"`;
    if (email) yaml += `\nemail: "${escapeYaml(email)}"`;

    yaml += `

author: name: "${escapeYaml(authorName)}"`;
    if (avatar) yaml += `\n  avatar: "${escapeYaml(avatar)}"`;
    if (bio) yaml += `\n  bio: "${escapeYaml(bio)}"`;
    if (location) yaml += `\n  location: "${escapeYaml(location)}"`;
    if (github) yaml += `\n  github_username: "${escapeYaml(github)}"`;
    if (twitter) yaml += `\n  twitter_username: "${escapeYaml(twitter)}"`;

    // Liens sociaux
    const hasSocialLinks = github || twitter || linkedin || instagram || youtube || mastodon || bluesky || discord;
    if (hasSocialLinks) {
      yaml += `

# Liens sociaux
# -------------------------------------------------------------------------
links:`;
      if (github) yaml += `\n  - label: "GitHub"\n    icon: "bi-github"\n    url: "https://github.com/${escapeYaml(github)}"`;
      if (twitter) yaml += `\n  - label: "X"\n    icon: "bi-twitter-x"\n    url: "https://x.com/${escapeYaml(twitter)}"`;
      if (linkedin) yaml += `\n  - label: "LinkedIn"\n    icon: "bi-linkedin"\n    url: "https://linkedin.com/in/${escapeYaml(linkedin)}"`;
      if (instagram) yaml += `\n  - label: "Instagram"\n    icon: "bi-instagram"\n    url: "https://instagram.com/${escapeYaml(instagram)}"`;
      if (youtube) yaml += `\n  - label: "YouTube"\n    icon: "bi-youtube"\n    url: "${escapeYaml(youtube)}"`;
      if (mastodon) yaml += `\n  - label: "Mastodon"\n    icon: "bi-mastodon"\n    url: "${escapeYaml(mastodon)}"`;
      if (bluesky) yaml += `\n  - label: "Bluesky"\n    icon: "bi-cloud"\n    url: "https://bsky.app/profile/${escapeYaml(bluesky)}"`;
      if (discord) yaml += `\n  - label: "Discord"\n    icon: "bi-discord"\n    url: "${escapeYaml(discord)}"`;
    }

    // Apparence
    yaml += `

# Apparence et image de marque
# -------------------------------------------------------------------------
theme_skin: "${themeSkin}" theme_color: main: "${primaryColor}"`;
    if (logo) yaml += `\nlogo: "${escapeYaml(logo)}"`;
    if (ogImage) yaml += `\nog_image: "${escapeYaml(ogImage)}"`;
    if (teaser) yaml += `\nteaser: "${escapeYaml(teaser)}"`;
    yaml += `\nbreadcrumbs: ${breadcrumbs}
words_per_minute: ${wpm}`;

    // Analytique
    if (gaId || posthogEnabled) {
      yaml += `

# Analytique
# -------------------------------------------------------------------------`;
      if (gaId) yaml += `\ngoogle_analytics: "${escapeYaml(gaId)}"`;
      
      if (posthogEnabled && posthogKey) {
        yaml += `

posthog: enabled: true api_key: "${escapeYaml(posthogKey)}" api_host: "${escapeYaml(posthogHost)}" autocapture: ${posthogAutocapture} session_recording: ${posthogSession} respect_dnt: ${posthogDnt}`;
      }
    }

    // Vérification du site
    if (googleVerify || bingVerify) {
      yaml += `

# Vérification du site
# -------------------------------------------------------------------------`;
      if (googleVerify) yaml += `\ngoogle_site_verification: "${escapeYaml(googleVerify)}"`;
      if (bingVerify) yaml += `\nbing_site_verification: "${escapeYaml(bingVerify)}"`;
    }

    // Commentaires
    if (giscusEnabled && giscusRepoId) {
      yaml += `

# Commentaires (Giscus)
# -------------------------------------------------------------------------
gisgus: enabled: true data-repo-id: "${escapeYaml(giscusRepoId)}" data-category-id: "${escapeYaml(giscusCategoryId)}"`;
    }

    // Paramètres de build
    yaml += `

# Paramètres de build
# -------------------------------------------------------------------------
markdown: ${markdown} paginate: ${paginate}`;

    // Fonctionnalités
    yaml += `

# Fonctionnalités
# -------------------------------------------------------------------------`;
    if (mermaid) {
      yaml += `
mermaid: src: '/assets/vendor/mermaid/mermaid.min.js'`;
    }

    // Copyright
    yaml += `

# Copyright
# -------------------------------------------------------------------------
cr_year: ${crYear} cr_entity: "${escapeYaml(crEntity)}" cr_license: "${crLicense}"`;

    // Plugins
    yaml += `

# Plugins (compatibles GitHub Pages)
# -------------------------------------------------------------------------
plugins:
  - github-pages
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-paginate
  - jekyll-relative-links
  - jekyll-redirect-from
  - jekyll-include-cache`;

    // Met à jour l'affichage
    const configOutput = document.getElementById('generated-config');
    if (configOutput) {
      configOutput.textContent = yaml;
    }

    // Enregistre dans localStorage
    saveConfig();

    return yaml;
  }

// Échappe les caractères spéciaux YAML function escapeYaml(str) {
    if (!str) return '';
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

// Enregistre la configuration dans localStorage function saveConfig() {
    const formData = {};
    document.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.id && el.id.startsWith('cfg-')) {
        formData[el.id] = el.type === 'checkbox' ? el.checked : el.value;
      }
    });
    localStorage.setItem('zer0-personalization-config', JSON.stringify(formData));
  }

// Charge la configuration depuis localStorage function loadConfig() {
    const saved = localStorage.getItem('zer0-personalization-config');
    if (saved) {
      try {
        const formData = JSON.parse(saved);
        Object.keys(formData).forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            if (el.type === 'checkbox') {
              el.checked = formData[id];
            } else {
              el.value = formData[id];
            }
          }
        });
        // Met à jour le compteur de caractères après le chargement
        if (descInput && charCount) {
          charCount.textContent = descInput.value.length;
        }
      } catch (e) {
        console.warn('Impossible de charger la configuration enregistrée :', e);
      }
    }
    generateConfig();
  }

// Réinitialise tous les champs function resetAll() {
    if (confirm('Réinitialiser tous les champs aux valeurs par défaut ? Cette action est irréversible.')) {
      document.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.id && el.id.startsWith('cfg-')) {
          if (el.type === 'checkbox') {
            // Réinitialise les cases à cocher selon leur data-default ou les valeurs par défaut standard
            el.checked = ['cfg-breadcrumbs', 'cfg-posthog-dnt', 'cfg-posthog-autocapture', 
                         'cfg-mermaid', 'cfg-mathjax', 'cfg-search'].includes(el.id);
          } else if (el.tagName === 'SELECT') {
            el.selectedIndex = 0;
          } else {
            el.value = '';
          }
        }
      });
      // Définit des valeurs par défaut spécifiques
      document.getElementById('cfg-locale').value = 'en-US';
      document.getElementById('cfg-title-separator').value = '|';
      document.getElementById('cfg-theme-skin').value = 'dark';
      document.getElementById('cfg-primary-color').value = '#007bff';
      document.getElementById('cfg-primary-color-picker').value = '#007bff';
      document.getElementById('cfg-wpm').value = '200';
      document.getElementById('cfg-paginate').value = '10';
      document.getElementById('cfg-port').value = '4000';
      document.getElementById('cfg-posthog-host').value = 'https://us.i.posthog.com';
      document.getElementById('cfg-cr-year').value = new Date().getFullYear();
      document.getElementById('cfg-markdown').value = 'kramdown';
      document.getElementById('cfg-cr-license').value = 'MIT';
      
      if (charCount) charCount.textContent = '0';
      
      localStorage.removeItem('zer0-personalization-config');
      generateConfig();
    }
  }

// Copy config to clipboard function copyConfig() {
    const config = document.getElementById('generated-config').textContent;
    const btn = document.getElementById('copy-config-btn');
    
    navigator.clipboard.writeText(config).then(() => {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check"></i> Copié !';
      btn.classList.remove('btn-success');
      btn.classList.add('btn-primary');
      
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Échec de la copie. Veuillez sélectionner et copier manuellement.');
    });
  }

// Event listeners for all form inputs document.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.id && el.id.startsWith('cfg-')) {
      el.addEventListener('input', generateConfig);
      el.addEventListener('change', generateConfig);
    }
  });

// Button event listeners const resetBtn = document.getElementById('reset-all-btn'); if (resetBtn) resetBtn.addEventListener('click', resetAll);
  
const copyBtn = document.getElementById('copy-config-btn'); if (copyBtn) copyBtn.addEventListener('click', copyConfig);

// Initialize loadConfig(); });
</script>

<style>
/* Form styling */ .form-label { font-weight: 500; }

.form-label i { margin-right: 0.25rem; }

.form-control:focus, .form-select:focus { border-color: var(--bs-primary); box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25); }

.form-control-color { width: 50px; padding: 0.25rem; }

/* Card hover effects */ .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }

.card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

/* Code block styling */ #generated-config { font-family: 'Fira Code', 'Courier New', Courier, monospace; font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }

/* Section anchors */ h2[id] { scroll-margin-top: 80px; }

/* Input group styling */ .input-group-text { font-size: 0.875rem; background-color: var(--bs-gray-100); }

/* Switch styling */ .form-check-input:checked { background-color: var(--bs-primary); border-color: var(--bs-primary); }

/* Character counter */ #desc-char-count { transition: color 0.2s ease; }

/* Responsive adjustments */ @media (max-width: 768px) { .card-body {
    padding: 1rem;
  }
  
  #generated-config {
    font-size: 0.75rem;
} }
</style>
