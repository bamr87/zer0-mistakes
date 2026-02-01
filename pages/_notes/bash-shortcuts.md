---
title: "Bash Terminal Shortcuts"
description: "Essential keyboard shortcuts and productivity tips for Bash and Zsh terminal navigation, editing, and history"
layout: note
date: 2026-01-27T10:00:00.000Z
lastmod: 2026-01-31T10:00:00.000Z
categories: [Notes, Productivity]
tags: [bash, terminal, shortcuts, productivity, zsh]
author: "Zer0-Mistakes Team"
difficulty: beginner
comments: true
permalink: /notes/bash-shortcuts/
---

## Cursor Navigation

### Moving Around

| Shortcut | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>A</kbd> | Move to beginning of line |
| <kbd>Ctrl</kbd> + <kbd>E</kbd> | Move to end of line |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> | Move forward one character |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Move backward one character |
| <kbd>Alt</kbd> + <kbd>F</kbd> | Move forward one word |
| <kbd>Alt</kbd> + <kbd>B</kbd> | Move backward one word |
| <kbd>Ctrl</kbd> + <kbd>XX</kbd> | Toggle between start of line and current position |

### Quick Tips

```bash
# Use arrow keys + Ctrl for word jumping
Ctrl + → (Right Arrow)  # Move forward one word
Ctrl + ← (Left Arrow)   # Move backward one word
```

---

## Text Editing

### Deleting Text

| Shortcut | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Delete character under cursor |
| <kbd>Ctrl</kbd> + <kbd>H</kbd> | Delete character before cursor (backspace) |
| <kbd>Ctrl</kbd> + <kbd>W</kbd> | Delete word before cursor |
| <kbd>Alt</kbd> + <kbd>D</kbd> | Delete word after cursor |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Delete from cursor to end of line |
| <kbd>Ctrl</kbd> + <kbd>U</kbd> | Delete from cursor to beginning of line |

### Cut, Copy, Paste

| Shortcut | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Paste (yank) last deleted text |
| <kbd>Alt</kbd> + <kbd>Y</kbd> | Cycle through kill ring (previous yanks) |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Cut from cursor to end of line |
| <kbd>Ctrl</kbd> + <kbd>U</kbd> | Cut from cursor to start of line |

### Modifying Text

| Shortcut | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>T</kbd> | Swap current character with previous |
| <kbd>Alt</kbd> + <kbd>T</kbd> | Swap current word with previous |
| <kbd>Alt</kbd> + <kbd>U</kbd> | Uppercase word from cursor |
| <kbd>Alt</kbd> + <kbd>L</kbd> | Lowercase word from cursor |
| <kbd>Alt</kbd> + <kbd>C</kbd> | Capitalize word from cursor |
| <kbd>Ctrl</kbd> + <kbd>_</kbd> | Undo last edit |

---

## Command History

### Navigation

| Shortcut | Action |
|----------|--------|
| <kbd>↑</kbd> / <kbd>Ctrl</kbd> + <kbd>P</kbd> | Previous command |
| <kbd>↓</kbd> / <kbd>Ctrl</kbd> + <kbd>N</kbd> | Next command |
| <kbd>Ctrl</kbd> + <kbd>R</kbd> | Reverse search history |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Forward search history |
| <kbd>Ctrl</kbd> + <kbd>G</kbd> | Cancel history search |
| <kbd>Alt</kbd> + <kbd>.</kbd> | Insert last argument of previous command |

### History Expansion

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

### History Commands

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

## Process Control

| Shortcut | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>C</kbd> | Interrupt (kill) current process |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Suspend current process |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Exit shell (or send EOF) |
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | Clear screen |

### Job Control

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

## Screen Control

| Shortcut | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | Clear screen (keep current line) |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Stop screen output |
| <kbd>Ctrl</kbd> + <kbd>Q</kbd> | Resume screen output |

### Terminal Commands

```bash
# Clear screen
clear

# Reset terminal
reset

# Clear scrollback
clear && printf '\e[3J'
```

---

## Command Line Tricks

### Auto-completion

| Shortcut | Action |
|----------|--------|
| <kbd>Tab</kbd> | Auto-complete command/filename |
| <kbd>Tab</kbd> <kbd>Tab</kbd> | Show all completions |
| <kbd>Alt</kbd> + <kbd>?</kbd> | Show completions |
| <kbd>Alt</kbd> + <kbd>*</kbd> | Insert all completions |

### Quick Substitution

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

### Brace Expansion

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

## Zsh-Specific Shortcuts

### Enhanced Features

| Shortcut | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>R</kbd> | Fuzzy history search (with fzf) |
| <kbd>Tab</kbd> | Smart completion with menu |
| <kbd>Alt</kbd> + <kbd>Enter</kbd> | Insert newline (multi-line command) |

### Directory Navigation

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

## Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:

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

## Quick Reference Card

### Essential Shortcuts

| Category | Shortcut | Action |
|----------|----------|--------|
| **Navigate** | <kbd>Ctrl</kbd>+<kbd>A</kbd> | Start of line |
| | <kbd>Ctrl</kbd>+<kbd>E</kbd> | End of line |
| | <kbd>Alt</kbd>+<kbd>F/B</kbd> | Word forward/back |
| **Edit** | <kbd>Ctrl</kbd>+<kbd>W</kbd> | Delete word |
| | <kbd>Ctrl</kbd>+<kbd>K</kbd> | Delete to end |
| | <kbd>Ctrl</kbd>+<kbd>U</kbd> | Delete to start |
| | <kbd>Ctrl</kbd>+<kbd>Y</kbd> | Paste deleted |
| **History** | <kbd>Ctrl</kbd>+<kbd>R</kbd> | Search history |
| | <kbd>↑</kbd>/<kbd>↓</kbd> | Navigate history |
| | `!!` | Last command |
| **Control** | <kbd>Ctrl</kbd>+<kbd>C</kbd> | Kill process |
| | <kbd>Ctrl</kbd>+<kbd>Z</kbd> | Suspend process |
| | <kbd>Ctrl</kbd>+<kbd>L</kbd> | Clear screen |
| | <kbd>Ctrl</kbd>+<kbd>D</kbd> | Exit shell |

---

## Resources

- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/)
- [Readline Documentation](https://tiswww.case.edu/php/chet/readline/rltop.html)
- [Zsh Documentation](https://zsh.sourceforge.io/Doc/)
- [The Art of Command Line](https://github.com/jlevy/the-art-of-command-line)
