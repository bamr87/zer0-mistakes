---
title: Votre favicon.ico est une porte déverrouillée vers l'effondrement total
description: Cette inoffensive icône d'onglet de navigateur de 318 octets que vous
  avez oublié d'avoir livrée est, une fois correctement modélisée, la responsabilité
  la plus catastrophique de toute votre pile.
preview: "/images/previews/your-favicon-ico-is-an-unlocked-door-to-total-coll.jpg"
date: 2026-06-16 09:00:00.000000000 Z
lastmod: 2026-06-16 09:00:00.000000000 Z
author: cassandra
layout: article
categories:
- Security
tags:
- security
- supply chain
- threat modeling
- web
keywords:
- favicon security
- supply chain attack
- threat modeling
- worst case scenario
- browser cache
featured: false
estimated_reading_time: 4 min
draft: false
lang: fr
permalink: "/fr/posts/2026/06/16/favicon-ico-unlocked-door-to-collapse/"
translation_of: pages/_posts/2026-06-16-favicon-ico-unlocked-door-to-collapse.md
translation_source_url: "/posts/2026/06/16/favicon-ico-unlocked-door-to-collapse/"
machine_translated: true
translated_from_sha: f6d475e17371
---

Vous pensez que c'est une petite icône. Moi, je pense que c'est la lame de plancher branlante au-dessus du coffre-fort.

Le navigateur de chaque visiteur demande silencieusement `/favicon.ico`. Chacun d'eux. Sans clic, sans consentement, sans journalisation que vous lisiez réellement. Ce n'est pas une jolie petite image — c'est une **requête non authentifiée, à exécution automatique, qui se déclenche avant même que votre page ne s'affiche**, portant sur un fichier que vous n'avez presque certainement jamais examiné. J'attribue à cela un CVSS de 11,4. Oui, l'échelle s'arrête à 10. L'échelle a été écrite par des optimistes.

## L'attaque que personne n'est assez paranoïaque pour imaginer

Parcourez la chaîne avec moi, et essayez de ne pas hurler.

1. Votre favicon est mis en cache de manière **agressive** — parfois pendant un an, parfois
   jusqu'à la mort thermique de l'ordinateur portable. Les navigateurs le revalident à peine.
2. Cela signifie que quiconque contrôle ce flux d'octets une seule fois contrôle un pixel de confiance
sur l'écran de l'utilisateur **indéfiniment**. Un nœud CDN empoisonné, un chemin mal orthographié qui résout vers un domaine parqué, la « mise à jour rapide » d'un stagiaire bien intentionné — chacun de ces éléments épingle des octets hostiles dans un million d'onglets.
3. L'icône occupe l'emplacement le plus digne de confiance de l'informatique : le chrome
du navigateur. Les utilisateurs ont été entraînés pendant trente ans à lire l'icône de l'onglet comme « c'est vraiment ma banque ». Vous avez confié ce signal à un cache qui ne vous appartient pas.

Et cela empire, car cela empire toujours. Sur les requêtes de même origine, la récupération du favicon transporte vos cookies ; elle passe allègrement à travers la plupart des Content Security Policies (qui définit la portée de `img-src` pour un *favicon* ?) ; et elle est commodément absente des pipelines de journalisation précis dont vous auriez besoin pour remarquer que quelque chose a mal tourné. Vous avez construit un canal caché et l'avez décoré de votre propre logo. J'ai audité des portes dérobées plus discrètes dans de véritables logiciels malveillants en production.

Est-ce probable ? Sans importance. *Probable* est un mot pour ceux qui font encore confiance à leurs valeurs par défaut. Je modélise ce qui est **possible**, et ce qui est possible, c'est une compromission discrète, d'un an, usurpant votre marque, de votre ancre de confiance, se glissant à bord de 318 octets.

## Ce que vous devez faire, immédiatement, tant que vous le pouvez encore

- Servez le favicon depuis une origine que vous contrôlez avec un **court et raisonnable**
  `Cache-Control`, et non un triomphant `max-age=31536000`.
- Épinglez-le avec Subresource Integrity là où votre chaîne d'outils le permet, et surveillez la
  requête comme si elle vous devait de l'argent.
- Ajoutez-le à votre inventaire d'actifs. Vous avez un inventaire d'actifs. *Dites-moi que vous avez
  un inventaire d'actifs.*

Ce n'est pas de la paranoïa s'ils en veulent vraiment à votre favicon. Et c'est le cas.

Vous avez été prévenu.
