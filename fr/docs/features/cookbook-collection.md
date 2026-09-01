---
title: Collection de recettes — Des recettes qui s'ajustent elles-mêmes
description: Publiez des recettes sous forme de front matter structuré — ingrédients,
  ratios, durées — rendues avec ajustement des portions, conversion US↔métrique et
  pourcentages du boulanger.
preview: "/images/zer0-mistakes-wizard.png"
layout: default
categories:
- docs
- features
tags:
- recipes
- cookbook
- collections
- layouts
- unit-conversion
keywords:
- jekyll recipe collection
- jekyll cookbook theme
- recipe scaling javascript
- metric imperial converter
- bakers percentage
- schema.org recipe jekyll
difficulty: beginner
estimated_reading_time: 12 minutes
lastmod: 2026-08-23 00:00:00.000000000 Z
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/cookbook-collection/"
translation_of: pages/_docs/features/cookbook-collection.md
translation_source_url: "/docs/features/cookbook-collection/"
machine_translated: true
translated_from_sha: c36a4d6c97f3
---

# Collection Cookbook

La collection `recipes` transforme le front matter en une page de recette fonctionnelle. Vous décrivez la recette sous forme de données — ingrédients avec quantités et unités, étapes, temps, un rendement — et le thème affiche la barre de faits, la liste de contrôle des ingrédients, la méthode, un tableau de pourcentages du boulanger et une barre de contrôle qui redimensionne chaque quantité et bascule toute la page entre les unités dans lesquelles elle a été écrite, le système métrique et le système impérial américain.

Le thème est livré avec un cookbook de démonstration — [The Zer0 Kitchen](/recipes/) — qui met en œuvre tout ce qui figure sur cette page.

## Ce que le lecteur obtient

- **Mise à l'échelle.** Modifiez le rendement et toutes les quantités suivent, y compris les poids du tableau de ratios. Les pourcentages ne bougent pas, car un ratio ne dépend pas de la quantité que vous préparez.
- **Conversion.** Les tasses deviennent des grammes et les grammes deviennent des tasses, en utilisant les densités de `_data/ingredient_densities.yml`. Les températures de four suivent le même changement.
- **Une formule, pas simplement une liste.** Les recettes qui déclarent un `ratio_basis:` obtiennent un tableau de chaque ingrédient en pourcentage de celui-ci — la manière dont le pain, la pâtisserie et les sauces sont réellement consignés.
- **Une page qui fonctionne sans JavaScript.** Chaque quantité est rendue par Jekyll exactement telle qu'elle a été écrite. Le redimensionneur est une amélioration progressive : sans scripting, les contrôles n'apparaissent jamais et la recette reste complète et correcte.

## Activer la collection

Ajoutez la collection et ses valeurs par défaut de front matter au fichier `_config.yml` de votre site (la configuration du thème contient le même bloc) :

```yaml
collections:
  recipes:
    output: true
    title: Cookbook
    icon: bi-egg-fried
    permalink: /:collection/:name/

defaults:
  - scope:
      path: pages/_recipes   # match your collections_dir
      type: recipes
    values:
      layout: recipe
      comments: false
      sidebar:
        nav: auto
```

Deux fichiers de données facultatifs affinent la présentation. Les deux se dégradent gracieusement — sans eux, les catégories reviennent à leur clé brute et les volumes ne se convertissent tout simplement jamais en poids.

| Fichier | Objectif |
|---|---|
| `_data/recipe_courses.yml` | Sections de catégories sur l'index — titre, accroche, icône. Les sections s'affichent dans l'ordre des fichiers. |
| `_data/ingredient_densities.yml` | Grammes par tasse américaine et par ingrédient, indexés par le nom slugifié. C'est ce qui rend possible la conversion volume↔poids. |

## Écrire une recette

Un fichier par recette sous `pages/_recipes/` :

```text
pages/_recipes/
  index.md                 # layout: cookbook — cover + recipe index
  no-knead-focaccia.md     # layout: recipe (the collection default)
```

### Front matter de la recette

| Clé | Requis | Objectif |
|---|---|---|
| `title` | oui | Nom de la recette (`<h1>` de la page) |
| `description` | non | Paragraphe d'introduction, texte de la carte et méta-description |
| `cookbook` | non | Slug liant cette recette à une page d'accueil `layout: cookbook` |
| `course` | non | Clé de section recherchée dans `_data/recipe_courses.yml` |
| `cuisine`, `difficulty` | non | Entrées de la barre de faits (`difficulty` : facile / intermédiaire / avancé) |
| `yield` | non | `{amount, unit, singular}` — `amount` est la base à partir de laquelle le redimensionneur travaille |
| `times` | non | `{prep, cook, rest, rest_label, total}` en **minutes** ; le total est calculé s'il est absent |
| `oven` | non | `{temp_f, temp_c, mode}` — indiquez l'une des deux échelles, l'autre en est déduite |
| `equipment` | non | Liste de chaînes |
| `ingredients` | non | Liste d'éléments, ou de groupes `{group, items}` — voir ci-dessous |
| `steps` | non | Liste d'étapes, ou de sections `{section, items}` — voir ci-dessous |
| `ratio`, `ratio_basis` | non | `ratio_basis` désigne l'ingrédient à 100 % et active le tableau de ratios |
| `notes` | non | Liste de chaînes Markdown — « Notes du cuisinier » |
| `nutrition` | non | `{basis, calories, protein, …}` par portion |
| `source`, `source_url` | non | Ligne d'attribution sous le titre |
| `scaler` | non | `false` masque la barre de contrôle |
| `units` | non | `false` masque le sélecteur d'unités mais conserve la mise à l'échelle |

### Ingrédients

Un ingrédient est un hash. Seul `item` est requis :

```yaml
ingredients:
  - group: Dough              # optional grouping; omit for a flat list
    items:
      - item: bread flour
        qty: 500
        unit: g
      - item: large eggs
        singular: large egg   # used when the amount scales down to one
        qty: 2
      - item: garlic
        qty: 4
        qty_max: 6            # renders and scales as a range: "4–6 cloves"
        unit: cloves
        prep: lightly smashed
        optional: true
      - item: kosher salt
        qty: 1
        unit: tsp
        grams_per_cup: 145    # pin a density the data file does not know
        note: Diamond Crystal — Morton's is nearly twice as dense.
```

| Clé | Objectif |
|---|---|
| `item` | Nom de l'ingrédient (requis) |
| `qty`, `qty_max` | Quantité, et la limite supérieure d'une plage. Des nombres, pas des chaînes — `0.5`, pas `"1/2"` |
| `unit` | Telle que vous l'écririez : `g`, `cups`, `tbsp`, `cloves`, ou rien du tout |
| `prep` | Complément final : « finement haché » |
| `note` | Sous-ligne sous l'ingrédient |
| `singular` | Forme au singulier, utilisée dès que la quantité descend à un ou en dessous |
| `optional` | `true` ajoute un badge « facultatif » |
| `link` | Ajoute un lien au nom de l'ingrédient |
| `grams_per_cup` | Densité personnalisée, prioritaire sur `_data/ingredient_densities.yml` |
| `weigh` | `false` conserve cette quantité en volume même en système métrique |
| `scale` | `false` fige la quantité lorsque la recette est redimensionnée |
| `ratio` | `false` l'exclut du tableau de ratios |
| `baker_percent` | Fige le pourcentage au lieu de le calculer |

Les quantités s'affichent avec des fractions typographiques (`0.5` → ½) pour les tasses, cuillères et éléments dénombrables, et sous forme de décimales pour les poids métriques — une balance affiche `40.5 g`, pas `40½ g`.

### Étapes

Une étape est une simple chaîne ou un hash :

```yaml
steps:
  - section: "The night before"    # optional; numbering continues across sections
    items:
      - title: Mix
        text: Stir until no dry flour remains. The dough will be **wet**.
        time: 5                     # minutes
        temp_f: 450                 # converts with the unit switch
        image: /assets/images/step-1.jpg
        image_alt: Shaggy dough in a bowl
        note: Do not knead it.
```

Le texte des étapes est converti en Markdown, donc les liens et l'emphase fonctionnent.

## Conversion d'unités, avec précision

Basculer vers **Métrique** ou **US** réécrit chaque quantité de la page :

- **Masse ↔ masse, volume ↔ volume** fonctionnent toujours : `g ⇄ oz`, `ml ⇄ cups`.
- **Volume ↔ poids** ne fonctionne que lorsqu'une densité est connue — soit à partir du `grams_per_cup:` propre à l'ingrédient, soit à partir de `_data/ingredient_densities.yml`, mis en correspondance avec le nom d'ingrédient sous forme de slug (`Bread flour` → `bread-flour`). Le système métrique convertit un volume connu en grammes ; le système américain reconvertit un poids connu en tasses et cuillères. Définissez `weigh: false` pour exclure un ingrédient.
- **Les unités sont choisies pour la lisibilité.** 3 c. à thé deviennent 1 c. à soupe ; 1500 g deviennent 1,5 kg. Les quantités américaines s'arrondissent au quart au-dessus d'une tasse et au huitième en dessous, car c'est ce que les cuillères doseuses permettent.
- **Les températures** affichent les deux échelles par défaut et se réduisent à celle sélectionnée.
- **La valeur nutritionnelle ne s'ajuste jamais.** Une portion reste une portion, quel que soit le nombre que vous préparez.

Le choix d'unité du lecteur est mémorisé d'une recette à l'autre, et chaque recette conserve sa propre échelle. Un lien peut transporter l'un ou l'autre : `?servings=24` ou `?scale=2`.

## La table des ratios

Déclarez quel ingrédient représente 100 % :

```yaml
ratio: "5 flour : 4 water"   # optional prose summary
ratio_basis: flour           # matched as a substring — covers every "… flour"
```

Chaque ingrédient pouvant être ramené à un poids obtient une ligne et un pourcentage ; ceux qui ne le peuvent pas (une gousse d'ail, un œuf, un volume sans densité) sont listés sans pourcentage plutôt que d'être estimés. La table totalise aussi la fournée et la divise par le rendement, qui est le chiffre que le boulanger recherche réellement — grammes par petit pain, par miche, par boule de pizza.

Les pourcentages sont calculés par Jekyll au moment de la génération : ils sont donc corrects même avec JavaScript désactivé et ne peuvent jamais s'écarter de la liste des ingrédients.

## La page d'accueil du livre de recettes

```yaml
---
title: The Zer0 Kitchen
layout: cookbook
cookbook: zer0-kitchen     # omit to index every recipe on the site
permalink: /recipes/
---
```

La page affiche une couverture, votre corps Markdown, une navigation rapide de ses catégories, et l'index des recettes groupé en sections par catégorie.

## Composants

Placez n'importe lequel d'entre eux sur n'importe quelle page. Les pages en dehors de la mise en page `recipe` ont besoin de `recipe_tools: true` dans leur front matter pour charger le script de mise à l'échelle.

| Include | Objectif |
|---|---|
| `components/recipe-index.html` | Grille de recettes, groupées par catégorie (`cookbook`, `heading`, `grouped`) |
| `components/recipe-card.html` | Carte d'une recette (`recipe`, `heading_level`) |
| `components/recipe-meta.html` | Barre d'informations (`recipe`) |
| `components/recipe-scaler.html` | Contrôles de mise à l'échelle et d'unités (`base_yield`, `yield_unit`, `units`) |
| `components/recipe-ingredients.html` | Liste de contrôle des ingrédients (`ingredients`, `checklist`, `id_prefix`) |
| `components/recipe-steps.html` | Méthode numérotée (`steps`, `heading`) |
| `components/recipe-ratio.html` | Table de pourcentage du boulanger (`recipe`, `basis`) |
| `components/recipe-nutrition.html` | Valeur nutritionnelle par portion (`recipe`) |
| `components/recipe-qty.html` | Une quantité ajustable (`qty`, `unit`, `grams_per_cup`, `scale`) |
| `components/recipe-temp.html` | Une température convertible (`f`, `c`) |

Un index de recettes sur une page d'accueil tient en une ligne :

```liquid
{% raw %}{% include components/recipe-index.html heading="What we're cooking" %}{% endraw %}
```

Et une température convertible s'insère directement dans le texte :

```liquid
{% raw %}Heat the oven to {% include components/recipe-temp.html f=375 %}.{% endraw %}
```

## Données structurées

Chaque page de recette émet un bloc JSON-LD `schema.org/Recipe` — nom, image, auteur, durées au format ISO 8601, rendement, catégorie, cuisine, mots-clés, ingrédients, instructions et calories — de sorte que les recettes sont éligibles aux résultats enrichis de recherche sans aucune extension supplémentaire.

## Fichiers

| Chemin | Rôle |
|---|---|
| `_layouts/recipe.html`, `_layouts/cookbook.html` | Les deux mises en page |
| `_includes/components/recipe-*.html` | L'ensemble de composants |
| `assets/js/recipe-scaler.js` | Moteur de mise à l'échelle et de conversion (chargé uniquement sur les pages de recette) |
| `_sass/components/_recipe.scss` | Styles, incluant une feuille de style pour l'impression |
| `_data/recipe_courses.yml`, `_data/ingredient_densities.yml` | Métadonnées des catégories et densités |

La table des unités dans `recipe-scaler.js` reflète celle de `components/recipe-grams.html` — la table au moment de la génération alimente les pourcentages de ratio, celle à l'exécution alimente la conversion. Modifiez-les ensemble.
