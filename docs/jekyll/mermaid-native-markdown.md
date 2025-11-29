---
title: Mermaid with Native Markdown Syntax
description: Simple Mermaid diagrams using native markdown code blocks - GitHub Pages compatible
date: 2025-01-27
tags:
  - Mermaid
  - Markdown
  - Jekyll
  - GitHub Pages
categories:
  - Documentation
layout: default
permalink: /docs/jekyll/mermaid-native-markdown/
mermaid: true
draft: draft
lastmod: 2025-11-28T00:00:00.000Z
---

# Mermaid with Native Markdown Syntax

**✨ Simple Implementation:** No HTML tags needed! Just use markdown code blocks.

**🌐 GitHub Pages Compatible:** Works with GitHub Pages without custom plugins!

---

## 🚀 Quick Start

### Step 1: Enable Mermaid in Front Matter

Add `mermaid: true` to your page's front matter:

```yaml
---
title: My Page with Diagrams
mermaid: true
---
```

### Step 2: Write Markdown Code Blocks

Use triple backticks with `mermaid` as the language:

````markdown
```mermaid
graph TD
    A[Start] --> B[End]
```
````

### That's It!

The native markdown syntax is automatically converted to rendered diagrams.

---

## 📊 Examples

### Example 1: Basic Flowchart

````markdown
```mermaid
graph TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[Car]
```
````

**Result:**

```mermaid
graph TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[Car]
```

---

### Example 2: Sequence Diagram

````markdown
```mermaid
sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!
```
````

**Result:**

```mermaid
sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!
```

---

### Example 3: Class Diagram

````markdown
```mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
```
````

**Result:**

```mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
```

---

### Example 4: State Diagram

````markdown
```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```
````

**Result:**

```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```

---

### Example 5: Gantt Chart

````markdown
```mermaid
gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2025-01-01, 30d
    Another task     :after a1  , 20d
```
````

**Result:**

```mermaid
gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2025-01-01, 30d
    Another task     :after a1  , 20d
```

---

### Example 6: Pie Chart

````markdown
```mermaid
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
```
````

**Result:**

```mermaid
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
```

---

## 🎯 Benefits

### ✅ Simpler Syntax

- **Before:** `<div class="mermaid">graph TD...</div>` + `mermaid: true` in front matter
- **After:** Just ` ```mermaid ... ``` ` in markdown

### ✅ Standard Markdown

- Native markdown code block syntax
- Compatible with other markdown processors
- GitHub-style fenced code blocks

### ✅ No Configuration Needed

- No front matter variables required
- No conditional includes
- Just write and it works

### ✅ Cleaner Content

- Pure markdown syntax
- No HTML mixed in
- Easier to read and edit

---

## 📚 All Supported Diagram Types

| Type          | Syntax            | Description                 |
| ------------- | ----------------- | --------------------------- |
| **Flowchart** | `graph TD`        | Process flows and decisions |
| **Sequence**  | `sequenceDiagram` | System interactions         |
| **Class**     | `classDiagram`    | OOP relationships           |
| **State**     | `stateDiagram-v2` | State machines              |
| **ER**        | `erDiagram`       | Database schemas            |
| **Gantt**     | `gantt`           | Project timelines           |
| **Pie**       | `pie`             | Data percentages            |
| **Git**       | `gitGraph`        | Version control flows       |
| **Journey**   | `journey`         | User experiences            |

---

## 🔧 Configuration

The plugin is configured in `_config.yml`:

```yaml
plugins:
  - jekyll-mermaid

mermaid:
  src: "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"
```

**That's all the configuration needed!**

---

## 📝 Usage Summary

### In Your Markdown Files

Just use standard markdown code blocks:

````markdown
```mermaid
graph LR
    A --> B --> C
```
````

### No Front Matter Needed

Unlike the previous implementation, you don't need:

```yaml
---
mermaid: true # ← NOT NEEDED ANYMORE
---
```

### No HTML Tags Needed

Unlike the previous implementation, you don't need:

```html
<div class="mermaid">
  <!-- ← NOT NEEDED ANYMORE -->
  graph LR A --> B
</div>
```

---

## 🎓 Quick Reference

### Flowchart Directions

```
TD or TB - Top to bottom
BT - Bottom to top
LR - Left to right
RL - Right to left
```

### Node Shapes

```
[Rectangle]
(Rounded)
{Diamond}
((Circle))
>Flag]
```

### Arrow Types

```
-->  Solid arrow
-.-> Dotted arrow
==>  Thick arrow
--   Line without arrow
```

---

## 🔗 Resources

- **Jekyll-Mermaid:** [GitHub Repository](https://github.com/jasonbellamy/jekyll-mermaid)
- **Mermaid Docs:** [Official Documentation](https://mermaid.js.org/)
- **Live Editor:** [Test Your Diagrams](https://mermaid.live/)
- **Syntax Guide:** [Complete Reference](https://mermaid.js.org/intro/syntax-reference.html)

---

## ✨ Advantages of This Approach

1. **Native Markdown** - Standard fenced code blocks
2. **Simpler** - No HTML, no front matter variables
3. **Portable** - Works with other markdown processors
4. **Cleaner** - Easier to read and maintain
5. **Automatic** - Plugin handles everything
6. **GitHub-Style** - Same syntax as GitHub markdown

---

**Happy Diagramming! 📊✨**

_Using jekyll-mermaid plugin for automatic diagram generation from native markdown._
