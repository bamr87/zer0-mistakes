---
title: Aide-mémoire des commandes Git
description: Référence rapide des commandes Git essentielles avec des exemples pratiques
  pour les flux de travail quotidiens de gestion de versions
layout: note
date: 2026-01-31 10:00:00.000000000 Z
lastmod: 2026-01-31 10:00:00.000000000 Z
categories:
- Notes
- Reference
tags:
- git
- version-control
- cheatsheet
- reference
author: Zer0-Mistakes Team
difficulty: beginner
comments: true
lang: fr
permalink: "/fr/notes/git-cheatsheet/"
translation_of: pages/_notes/git-cheatsheet.md
translation_source_url: "/notes/git-cheatsheet/"
machine_translated: true
translated_from_sha: 7bb8c6a30443
---

## Prise en main

### Initialiser et cloner

```bash
# Initialize a new repository
git init

# Clone an existing repository
git clone https://github.com/user/repo.git

# Clone to a specific directory
git clone https://github.com/user/repo.git my-project

# Clone a specific branch
git clone -b develop https://github.com/user/repo.git
```

### Configuration

```bash
# Set user name globally
git config --global user.name "Your Name"

# Set email globally
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# List all configuration
git config --list

# Edit global config
git config --global --edit
```

---

## Flux de travail quotidien

### État et modifications

```bash
# Check repository status
git status

# Short status format
git status -s

# View unstaged changes
git diff

# View staged changes
git diff --staged

# View changes in specific file
git diff path/to/file.txt
```

### Indexation et validation

```bash
# Stage specific file
git add file.txt

# Stage all changes
git add .

# Stage with interactive selection
git add -p

# Commit with message
git commit -m "feat: add new feature"

# Commit all tracked changes
git commit -am "fix: resolve bug"

# Amend last commit
git commit --amend

# Amend without changing message
git commit --amend --no-edit
```

### Consulter l'historique

```bash
# View commit log
git log

# Compact log (one line per commit)
git log --oneline

# Log with graph
git log --oneline --graph --all

# View last 5 commits
git log -5

# View commits by author
git log --author="Name"

# View file history
git log -- path/to/file.txt

# Show commit details
git show commit-hash
```

---

## Branches et fusions

### Gestion des branches

```bash
# List branches
git branch

# List all branches (including remote)
git branch -a

# Create new branch
git branch feature/new-feature

# Create and switch to branch
git checkout -b feature/new-feature

# Switch to existing branch
git checkout main
# OR (newer syntax)
git switch main

# Delete local branch
git branch -d feature/merged-branch

# Force delete branch
git branch -D feature/unmerged-branch

# Rename current branch
git branch -m new-name
```

### Fusion

```bash
# Merge branch into current
git merge feature/branch-name

# Merge with no fast-forward (preserves history)
git merge --no-ff feature/branch-name

# Abort merge
git merge --abort

# Squash merge (combine commits)
git merge --squash feature/branch-name
```

### Rebasage

```bash
# Rebase current branch onto main
git rebase main

# Interactive rebase (last 3 commits)
git rebase -i HEAD~3

# Abort rebase
git rebase --abort

# Continue rebase after resolving conflicts
git rebase --continue
```

---

## Opérations distantes

### Gérer les dépôts distants

```bash
# List remotes
git remote -v

# Add remote
git remote add origin https://github.com/user/repo.git

# Remove remote
git remote remove origin

# Rename remote
git remote rename origin upstream

# Show remote details
git remote show origin
```

### Synchronisation

```bash
# Fetch from remote
git fetch origin

# Fetch all remotes
git fetch --all

# Pull changes (fetch + merge)
git pull origin main

# Pull with rebase
git pull --rebase origin main

# Push to remote
git push origin main

# Push and set upstream
git push -u origin feature/branch

# Force push (use with caution!)
git push --force-with-lease origin branch
```

---

## Annuler des modifications

### Abandonner des modifications

```bash
# Discard unstaged changes in file
git checkout -- file.txt
# OR (newer syntax)
git restore file.txt

# Discard all unstaged changes
git checkout -- .

# Unstage file (keep changes)
git reset HEAD file.txt
# OR (newer syntax)
git restore --staged file.txt

# Unstage all files
git reset HEAD
```

### Annuler des commits

```bash
# Revert commit (creates new commit)
git revert commit-hash

# Revert last commit
git revert HEAD

# Reset to commit (keep changes staged)
git reset --soft commit-hash

# Reset to commit (keep changes unstaged)
git reset --mixed commit-hash

# Reset to commit (discard changes)
git reset --hard commit-hash
```

---

## Remisage (stash)

```bash
# Stash changes
git stash

# Stash with message
git stash save "WIP: feature work"

# List stashes
git stash list

# Apply last stash (keep in stash list)
git stash apply

# Apply and remove from stash list
git stash pop

# Apply specific stash
git stash apply stash@{2}

# Drop specific stash
git stash drop stash@{0}

# Clear all stashes
git stash clear

# Create branch from stash
git stash branch new-branch stash@{0}
```

---

## Commandes avancées

### Cherry-pick

```bash
# Apply specific commit to current branch
git cherry-pick commit-hash

# Cherry-pick without committing
git cherry-pick --no-commit commit-hash
```

### Étiquettes (tags)

```bash
# List tags
git tag

# Create lightweight tag
git tag v1.0.0

# Create annotated tag
git tag -a v1.0.0 -m "Version 1.0.0"

# Tag specific commit
git tag -a v1.0.0 commit-hash

# Push tag to remote
git push origin v1.0.0

# Push all tags
git push origin --tags

# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0
```

### Bisect (recherche de bugs)

```bash
# Start bisect
git bisect start

# Mark current as bad
git bisect bad

# Mark known good commit
git bisect good commit-hash

# Git will checkout commits for testing
# After each test, mark as:
git bisect good  # if working
git bisect bad   # if broken

# End bisect
git bisect reset
```

---

## Alias utiles

Ajoutez-les à votre `~/.gitconfig` :

```ini
[alias]
    st = status -s
    co = checkout
    br = branch
    ci = commit
    lg = log --oneline --graph --all
    last = log -1 HEAD
    unstage = reset HEAD --
    amend = commit --amend --no-edit
    wip = !git add -A && git commit -m 'WIP'
    undo = reset --soft HEAD~1
    branches = branch -a
    tags = tag -l
    stashes = stash list
```

---

## Tableau de référence rapide

| Action | Commande |
|--------|---------|
| Initialiser un dépôt | `git init` |
| Cloner un dépôt | `git clone <url>` |
| Vérifier l'état | `git status` |
| Indexer un fichier | `git add <file>` |
| Valider | `git commit -m "message"` |
| Pousser | `git push origin <branch>` |
| Tirer | `git pull origin <branch>` |
| Créer une branche | `git checkout -b <branch>` |
| Changer de branche | `git checkout <branch>` |
| Fusionner | `git merge <branch>` |
| Afficher le journal | `git log --oneline` |
| Remiser | `git stash` |
| Appliquer le remisage | `git stash pop` |

---

## Ressources

- [Documentation officielle de Git](https://git-scm.com/doc)
- [Livre Pro Git (gratuit)](https://git-scm.com/book/en/v2)
- [Aide-mémoire Git de GitHub](https://education.github.com/git-cheat-sheet-education.pdf)
- [Tutoriels Git d'Atlassian](https://www.atlassian.com/git/tutorials)
