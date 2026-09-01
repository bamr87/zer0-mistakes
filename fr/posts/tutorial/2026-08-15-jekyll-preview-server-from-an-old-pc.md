---
title: Transformez un PC à la retraite en serveur de prévisualisation Jekyll toujours
  prêt
description: Servez votre site Jekyll depuis un ordinateur de bureau vieux de 14 ans
  avec Docker, LiveReload sur le réseau local et une boucle de synchronisation en
  une seule commande — un environnement de préproduction gratuit pour le travail sur
  les thèmes.
date: 2026-08-15 12:00:00.000000000 Z
lastmod: 2026-08-15 12:00:00.000000000 Z
author: default
layout: article
categories:
- Tutorial
tags:
- jekyll
- docker
- homelab
- livereload
- workflow
featured: false
estimated_reading_time: 8 min
draft: false
lang: fr
permalink: "/fr/posts/2026/08/15/jekyll-preview-server-from-an-old-pc/"
translation_of: pages/_posts/tutorial/2026-08-15-jekyll-preview-server-from-an-old-pc.md
translation_source_url: "/posts/2026/08/15/jekyll-preview-server-from-an-old-pc/"
machine_translated: true
translated_from_sha: 22764b20a0e9
---

Le travail sur les thèmes pose un problème de prévisualisation. `jekyll serve` sur votre ordinateur portable s'arrête quand vous rabattez l'écran, monopolise un port dont vous aviez besoin pour autre chose, et n'affiche le site que sur un seul écran — le vôtre. Pendant ce temps, il y a probablement un ordinateur de bureau parfaitement fonctionnel dans un placard, capable de faire tourner un build de votre site toute la journée, sur tous les appareils de la maison.

Ce tutoriel transforme cette machine en serveur de prévisualisation permanent : votre thème servi sur le réseau local avec LiveReload, mis à jour d'une seule commande depuis votre ordinateur portable. Le matériel de référence est une tour Core i7 de 2012 — 14 ans d'âge — et elle s'en sort sans broncher. Les builds Jekyll sont peu gourmands en CPU et tolérants en RAM ; c'est exactement la charge de travail à laquelle le vieux matériel reste bon.

## Ce que vous obtenez au final

- `http://<server>.local:4000` — votre site, accessible depuis votre ordinateur portable, votre tablette et votre téléphone
- LiveReload qui se déclenche à chaque reconstruction, sur tous les appareils à la fois
- Une boucle de synchronisation où « déployer en prévisualisation » tient en une seule commande
- Zéro coût cloud, zéro batterie d'ordinateur portable gaspillée sur `--watch`

## Prérequis

- Un vieux PC sous n'importe quel Linux avec Docker et SSH (une installation Debian minimale suffit largement)
- Votre projet Jekyll avec un `docker-compose.yml` — celui livré avec ce thème fonctionne tel quel
- Les machines sur le même réseau local

## Étape 1 : mettre le projet sur le serveur

Oubliez complètement git sur le serveur — vous voulez prévisualiser votre *arbre de travail*, changements non validés inclus. `rsync` est le bon outil :

```bash
rsync -a \
  --exclude _site --exclude .jekyll-cache --exclude node_modules \
  ./ server:dev/my-theme/
```

Les exclusions ont leur importance : `_site` et `.jekyll-cache` seront reconstruits côté serveur (et les caches montés en volume ne doivent pas être écrasés en plein build), et `node_modules` est spécifique à la plateforme — laissez le conteneur gérer ses propres dépendances.

## Étape 2 : servir sur le réseau local, pas sur localhost

Le fichier compose par défaut lie déjà Jekyll à `0.0.0.0:4000`, ce qui permet la prévisualisation sur le réseau local. Deux choses à vérifier :

```yaml
command: >
  bundle exec jekyll serve --watch --livereload
  --host 0.0.0.0 --port 4000
ports:
  - "4000:4000"
  - "35729:35729"   # LiveReload's own port — forget this and reloads silently fail
```

Ce second mappage de port est celui que tout le monde oublie. LiveReload fait tourner son propre serveur websocket sur le port 35729 ; s'il n'est pas publié, la page se charge correctement mais ne se rafraîchit jamais, et vous en accuserez Jekyll.

Si le serveur fait tourner un pare-feu (ce qui devrait être le cas), autorisez les deux ports depuis votre sous-réseau uniquement :

```bash
sudo ufw allow from 192.168.4.0/24 to any port 4000 proto tcp
sudo ufw allow from 192.168.4.0/24 to any port 35729 proto tcp
```

Ensuite, sur le serveur : `docker compose up -d`. Le premier build prend quelques minutes le temps que les gems s'installent dans le volume bundle-cache ; tous les démarrages suivants ne prennent que quelques secondes.

## Étape 3 : boucler le tout avec une seule commande

Un workflow ne vaut que par l'absence de frictions. Ajoutez ceci à votre profil shell :

```bash
preview() {
  rsync -a --exclude _site --exclude .jekyll-cache --exclude node_modules \
    ./ server:dev/${PWD##*/}/
}
```

Désormais la boucle est : éditer → `preview` → chaque appareil ouvert se recharge tout seul. Le `--watch` de Jekyll voit arriver les changements synchronisés par rsync et reconstruit ; LiveReload envoie le rafraîchissement. Vous ne touchez jamais au serveur.

C'est là que la partie multi-appareils devient discrètement la fonctionnalité phare pour le développement de thèmes : gardez le téléphone posé à côté de votre éditeur, affichant la même page que le navigateur de votre bureau. Les régressions responsives apparaissent dès que vous les provoquez, et non quand vous pensez à vérifier le mode appareil des outils de développement.

## Étape 4 : faire disparaître le serveur

Un serveur de prévisualisation qu'il faut *gérer* est un serveur de prévisualisation que vous finirez par abandonner. Deux touches finales :

**Il survit aux redémarrages.** Le `restart: unless-stopped` de Compose (ou le simple fait de relancer `up -d`) fait qu'une coupure de courant ne vous coûte rien.

**Il ne coûte rien au repos.** Activez le Wake-on-LAN dans le BIOS et armez-le sur la carte réseau, puis éteignez la machine quand vous ne travaillez pas :

```bash
# on the server, once:
sudo ethtool -s eno1 wol g
# from your laptop, when starting a session:
wakeonlan aa:bb:cc:dd:ee:ff   # ~30 seconds later, the preview is back
```

## Pourquoi ne pas simplement utiliser l'ordinateur portable ?

Pour une vérification rapide, faites-le. Le serveur permanent justifie son existence spécifiquement pour le travail sur les thèmes : les longues sessions où vous voulez voir le site sur trois tailles d'écran à la fois, les builds qui n'épuisent pas la batterie ni les ventilateurs de votre portable, et une URL que vous pouvez donner à n'importe qui dans la maison — « regarde `forge.local:4000` et dis-moi si la navigation te semble juste » est un test d'utilisabilité qui ne coûte rien.

La tour de 14 ans pour laquelle ceci a été écrit fait aussi tourner le Postgres du foyer, une pile de logs et une console de supervision depuis la même installation Docker. Le vieux matériel est lent sur exactement deux choses — les rafales modernes sur un seul thread et tout ce qui nécessite un GPU récent. Servir un site statique sur un réseau local n'est ni l'un ni l'autre. Mettez la machine du placard sur l'équipe de nuit.
