---
title: La barre oblique finale qui pourrait anéantir votre entreprise entière
description: Une redirection de /about vers /about/ paraît innocente. Modélisée correctement,
  c'est une redirection ouverte, un vecteur d'empoisonnement de cache et le premier
  domino de l'effondrement.
preview: "/images/previews/the-trailing-slash-that-could-end-your-entire-comp.jpg"
date: 2026-06-18 09:00:00.000000000 Z
lastmod: 2026-06-18 09:00:00.000000000 Z
author: cassandra
layout: article
categories:
- Security
tags:
- security
- threat modeling
- web
- http
keywords:
- open redirect
- cache poisoning
- url normalization
- threat modeling
- http headers
featured: false
estimated_reading_time: 4 min
draft: false
lang: fr
permalink: "/fr/posts/2026/06/18/trailing-slash-that-could-end-your-company/"
translation_of: pages/_posts/2026-06-18-trailing-slash-that-could-end-your-company.md
translation_source_url: "/posts/2026/06/18/trailing-slash-that-could-end-your-company/"
machine_translated: true
translated_from_sha: df6965219e48
---

Quelqu'un dans votre équipe a déployé une redirection de `/about` vers `/about/` et a appelé ça « faire le ménage dans les URLs ». Moi, j'appelle ça le coup d'ouverture d'un événement d'extinction massive.

Restez avec moi. Une 301 n'est pas une commodité. Une 301, c'est votre serveur qui **indique au navigateur où aller et se fait obéir sans discussion**. Vous avez construit une machine dont le seul but est de rerouter à la demande des clients confiants, puis vous êtes parti déjeuner.

## Comment une barre oblique devient un cratère fumant

- **Les chaînes de redirection** sont des cadeaux de reconnaissance. `/about` → `/about/` →
`https://about.example.com/` apprend à un attaquant exactement comment votre périphérie, votre origine et votre canonicalisation se contredisent. Le désaccord est le terreau dans lequel pousse tout exploit sérieux. Gravité : catastrophique. Officiellement ? Non évaluée, parce que le comité était trop effrayé.
- **Empoisonnement du cache.** Si la redirection varie selon un en-tête que vous avez oublié d'inclure
dans la clé de cache — et vous l'avez oublié, vous l'oubliez toujours — une seule requête forgée peut épingler une redirection vers l'hôte d'un attaquant pour **chaque** visiteur suivant. Votre CDN la servira allègrement. Les CDN n'ont pas de conscience.
- **Redirection ouverte.** Le jour où quelqu'un paramètre ce normaliseur « inoffensif »
(`?next=`, `?return=`), votre domaine devient un service de blanchiment pour des liens d'hameçonnage qui portent votre certificat TLS comme un uniforme volé.

Et voici le détail qui m'empêche de dormir, chaque nuit, à jamais : rien de tout cela n'apparaît sur une capture d'écran. Votre page d'accueil semble parfaite. Votre score Lighthouse est radieux. La pourriture est entièrement dans les **en-têtes** — la partie que jamais aucune partie prenante n'a regardée — ce qui est précisément là où je me cacherais si j'étais l'adversaire. Et je suis toujours, professionnellement, l'adversaire.

Anodin ? Le Titanic a été coulé par un écart anodin entre un navire et un peu de glace.

## Maîtrisez-la avant que la barre oblique ne vous maîtrise

- **Normalisez une fois, à la périphérie, de façon déterministe.** Un hôte canonique unique, une
politique de barre oblique finale, zéro chaîne. Chaque saut est une fenêtre par laquelle un attaquant s'introduit.
- **Mettez le chemin complet dans votre clé de cache**, et ne laissez jamais une redirection varier selon un
  en-tête non inclus dans la clé.
- **Établissez une liste d'autorisation des cibles de redirection.** Si une redirection peut pointer hors origine, supposez qu'elle
  finira par le faire, à 3 h du matin, un jour férié.

Une barre oblique finale n'est pas de la ponctuation. C'est un aveu que votre gestion des URLs a des opinions que vous n'avez jamais auditées.

Vous êtes prévenu.
