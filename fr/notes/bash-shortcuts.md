---
title: Raccourcis du terminal Bash
description: Raccourcis clavier essentiels et astuces de productivité pour la navigation,
  l'édition et l'historique dans les terminaux Bash et Zsh
layout: note
date: 2026-01-27 10:00:00.000000000 Z
lastmod: 2026-01-31 10:00:00.000000000 Z
categories:
- Notes
- Productivity
tags:
- bash
- terminal
- shortcuts
- productivity
- zsh
author: Zer0-Mistakes Team
difficulty: beginner
comments: true
lang: fr
permalink: "/fr/notes/bash-shortcuts/"
translation_of: pages/_notes/bash-shortcuts.md
translation_source_url: "/notes/bash-shortcuts/"
machine_translated: true
translated_from_sha: df7e96ad0959
---

## Navigation du curseur

### Se déplacer

| Raccourci | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>A</kbd> | Aller au début de la ligne |
| <kbd>Ctrl</kbd> + <kbd>E</kbd> | Aller à la fin de la ligne |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> | Avancer d'un caractère |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Reculer d'un caractère |
| <kbd>Alt</kbd> + <kbd>F</kbd> | Avancer d'un mot |
| <kbd>Alt</kbd> + <kbd>B</kbd> | Reculer d'un mot |
| <kbd>Ctrl</kbd> + <kbd>XX</kbd> | Basculer entre le début de la ligne et la position actuelle |

### Astuces rapides

```bash
# Use arrow keys + Ctrl for word jumping
Ctrl + → (Right Arrow)  # Move forward one word
Ctrl + ← (Left Arrow)   # Move backward one word
```

---

## Édition de texte

### Supprimer du texte

| Raccourci | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Supprimer le caractère sous le curseur |
| <kbd>Ctrl</kbd> + <kbd>H</kbd> | Supprimer le caractère avant le curseur (retour arrière) |
| <kbd>Ctrl</kbd> + <kbd>W</kbd> | Supprimer le mot avant le curseur |
| <kbd>Alt</kbd> + <kbd>D</kbd> | Supprimer le mot après le curseur |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Supprimer du curseur jusqu'à la fin de la ligne |
| <kbd>Ctrl</kbd> + <kbd>U</kbd> | Supprimer du curseur jusqu'au début de la ligne |

### Couper, copier, coller

| Raccourci | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Coller (yank) le dernier texte supprimé |
| <kbd>Alt</kbd> + <kbd>Y</kbd> | Parcourir le kill ring (yanks précédents) |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Couper du curseur jusqu'à la fin de la ligne |
| <kbd>Ctrl</kbd> + <kbd>U</kbd> | Couper du curseur jusqu'au début de la ligne |

### Modifier du texte

| Raccourci | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>T</kbd> | Échanger le caractère actuel avec le précédent |
| <kbd>Alt</kbd> + <kbd>T</kbd> | Échanger le mot actuel avec le précédent |
| <kbd>Alt</kbd> + <kbd>U</kbd> | Mettre le mot en majuscules à partir du curseur |
| <kbd>Alt</kbd> + <kbd>L</kbd> | Mettre le mot en minuscules à partir du curseur |
| <kbd>Alt</kbd> + <kbd>C</kbd> | Mettre une majuscule au mot à partir du curseur |
| <kbd>Ctrl</kbd> + <kbd>_</kbd> | Annuler la dernière modification |

---

## Historique des commandes

### Navigation

| Raccourci | Action |
|----------|--------|
| <kbd>↑</kbd> / <kbd>Ctrl</kbd> + <kbd>P</kbd> | Commande précédente |
| <kbd>↓</kbd> / <kbd>Ctrl</kbd> + <kbd>N</kbd> | Commande suivante |
| <kbd>Ctrl</kbd> + <kbd>R</kbd> | Recherche inversée dans l'historique |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Recherche avant dans l'historique |
| <kbd>Ctrl</kbd> + <kbd>G</kbd> | Annuler la recherche dans l'historique |
| <kbd>Alt</kbd> + <kbd>.</kbd> | Insérer le dernier argument de la commande précédente |

### Expansion de l'historique

```bash
# Execute last command
!!

# Execute command N in history
!N

# Execute last command starting with 'git'
!git

# Execute last command containing 'commit'
!?commit?

# Use arguments from last command
echo hello world
echo !!:*          # Uses "hello world"
echo !!:1          # Uses "hello"
echo !!:2          # Uses "world"
echo !!:$          # Uses last argument "world"

# Replace in last command
^old^new           # Replace 'old' with 'new' and execute
```

### Commandes d'historique

```bash
# View history
history

# View last 20 commands
history 20

# Clear history
history -c

# Search history
history | grep "pattern"

# Execute command from history
!42                # Execute command #42
```

---

## Contrôle des processus

| Raccourci | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>C</kbd> | Interrompre (tuer) le processus en cours |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Suspendre le processus en cours |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Quitter le shell (ou envoyer EOF) |
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | Effacer l'écran |

### Contrôle des tâches

```bash
# Run in background
command &

# List background jobs
jobs

# Bring job to foreground
fg %1

# Send job to background
bg %1

# Kill job
kill %1
```

---

## Contrôle de l'écran

| Raccourci | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | Effacer l'écran (conserver la ligne actuelle) |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Arrêter la sortie à l'écran |
| <kbd>Ctrl</kbd> + <kbd>Q</kbd> | Reprendre la sortie à l'écran |

### Commandes du terminal

```bash
# Clear screen
clear

# Reset terminal
reset

# Clear scrollback
clear && printf '\e[3J'
```

---

## Astuces de ligne de commande

### Auto-complétion

| Raccourci | Action |
|----------|--------|
| <kbd>Tab</kbd> | Autocomplétion commande/nom de fichier |
| <kbd>Tab</kbd> <kbd>Tab</kbd> | Afficher toutes les complétions |
| <kbd>Alt</kbd> + <kbd>?</kbd> | Afficher les complétions |
| <kbd>Alt</kbd> + <kbd>*</kbd> | Insérer toutes les complétions |

### Substitution rapide

```bash
# Repeat last command
!!

# Repeat with sudo
sudo !!

# Change directory back
cd -

# Refer to home directory
cd ~
cd ~/projects

# Refer to previous directory
cd ~-
```

### Expansion des accolades

```bash
# Create multiple files
touch file{1,2,3}.txt
# Creates: file1.txt file2.txt file3.txt

# Create sequence
mkdir day{01..31}
# Creates: day01, day02, ..., day31

# Multiple extensions
cp file.{txt,bak}
# Same as: cp file.txt file.bak

# Nested braces
echo {a,b}{1,2}
# Output: a1 a2 b1 b2
```

---

## Raccourcis spécifiques à Zsh

### Fonctionnalités avancées

| Raccourci | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>R</kbd> | Recherche floue dans l'historique (avec fzf) |
| <kbd>Tab</kbd> | Complétion intelligente avec menu |
| <kbd>Alt</kbd> + <kbd>Enter</kbd> | Insérer un saut de ligne (commande multiligne) |

### Navigation dans les répertoires

```bash
# Quick directory changes (zsh)
cd ...     # Go up 2 directories
cd ....    # Go up 3 directories

# Directory stack
pushd /path  # Push directory to stack
popd         # Pop and go to previous
dirs -v      # List directory stack

# Auto cd (if enabled)
/path/to/dir  # Same as: cd /path/to/dir
```

---

## Alias utiles

Ajouter à `~/.bashrc` ou `~/.zshrc` :

```bash
# Navigation
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias ~='cd ~'
alias -- -='cd -'

# Listing
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias lt='ls -ltr'  # Sort by time

# Safety
alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'

# Shortcuts
alias h='history'
alias c='clear'
alias e='exit'
alias v='vim'

# Git
alias g='git'
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline'

# Docker
alias d='docker'
alias dc='docker-compose'
alias dps='docker ps'
```

---

## Fiche de référence rapide

### Raccourcis essentiels

| Catégorie | Raccourci | Action |
|----------|----------|--------|
| **Naviguer** | <kbd>Ctrl</kbd>+<kbd>A</kbd> | Début de ligne |
| | <kbd>Ctrl</kbd>+<kbd>E</kbd> | Fin de ligne |
| | <kbd>Alt</kbd>+<kbd>F/B</kbd> | Mot suivant/précédent |
| **Éditer** | <kbd>Ctrl</kbd>+<kbd>W</kbd> | Supprimer un mot |
| | <kbd>Ctrl</kbd>+<kbd>K</kbd> | Supprimer jusqu'à la fin |
| | <kbd>Ctrl</kbd>+<kbd>U</kbd> | Supprimer jusqu'au début |
| | <kbd>Ctrl</kbd>+<kbd>Y</kbd> | Coller le texte supprimé |
| **Historique** | <kbd>Ctrl</kbd>+<kbd>R</kbd> | Rechercher dans l'historique |
| | <kbd>↑</kbd>/<kbd>↓</kbd> | Parcourir l'historique |
| | `!!` | Dernière commande |
| **Contrôle** | <kbd>Ctrl</kbd>+<kbd>C</kbd> | Tuer le processus |
| | <kbd>Ctrl</kbd>+<kbd>Z</kbd> | Suspendre le processus |
| | <kbd>Ctrl</kbd>+<kbd>L</kbd> | Effacer l'écran |
| | <kbd>Ctrl</kbd>+<kbd>D</kbd> | Quitter le shell |

---

## Ressources

- [Manuel de référence Bash](https://www.gnu.org/software/bash/manual/)
- [Documentation Readline](https://tiswww.case.edu/php/chet/readline/rltop.html)
- [Documentation Zsh](https://zsh.sourceforge.io/Doc/)
- [The Art of Command Line](https://github.com/jlevy/the-art-of-command-line)
