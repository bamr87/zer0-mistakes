---
title: Mermaid Diagrams
description: Complete guide to integrating Mermaid diagrams in Jekyll sites - flowcharts, sequence diagrams, class diagrams and more with GitHub Pages compatibility.
layout: default
categories:
    - docs
    - features
tags:
    - mermaid
    - diagrams
    - jekyll
    - flowchart
    - documentation
permalink: /docs/features/mermaid-diagrams/
mermaid: true
difficulty: beginner
estimated_time: 15 minutes
prerequisites:
    - Jekyll site with Bootstrap 5
    - Basic Markdown knowledge
sidebar:
    nav: docs
---

# Mermaid Diagrams

> Create flowcharts, sequence diagrams, class diagrams and more in your Jekyll site using Mermaid's simple text-based syntax.

**GitHub Pages Compatible** — Works without custom server-side plugins!

## Quick Start

### Step 1: Enable Mermaid on Your Page

Add `mermaid: true` to your page's front matter:

```yaml
---
title: "My Documentation Page"
mermaid: true
---
```

### Step 2: Write Your Diagram

Use native markdown code blocks with `mermaid` as the language:

````markdown
```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Success]
    B -->|No| D[Try Again]
```
````

**That's it!** The diagram renders automatically.

---

## Configuration

### Site Configuration

The theme includes Mermaid support in `_config.yml`:

```yaml
mermaid:
  src: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
```

### How It Works

1. **Front matter flag** — `mermaid: true` enables Mermaid on the page
2. **Conditional loading** — Script only loads when needed
3. **Client-side rendering** — No server-side plugin required
4. **Auto-initialization** — Diagrams render on page load

---

## Diagram Types

### 1. Flowcharts

The most common diagram type for documenting processes and workflows.

**Directions:**
- `TD` / `TB` — Top to Bottom
- `BT` — Bottom to Top
- `LR` — Left to Right
- `RL` — Right to Left

````markdown
```mermaid
graph LR
    A[Input] --> B[Process]
    B --> C{Valid?}
    C -->|Yes| D[Success]
    C -->|No| E[Error]
```
````

**Node Shapes:**

| Syntax | Shape | Use Case |
|--------|-------|----------|
| `A[Text]` | Rectangle | Actions, steps |
| `A(Text)` | Rounded | Processes |
| `A{Text}` | Diamond | Decisions |
| `A((Text))` | Circle | Start/End |
| `A[[Text]]` | Stadium | Subroutines |
| `A[(Text)]` | Cylinder | Database |

**Link Types:**

| Syntax | Description |
|--------|-------------|
| `-->` | Arrow |
| `---` | Line |
| `-.->` | Dotted arrow |
| `==>` | Thick arrow |
| `--\|Text\|-->` | Arrow with label |

### 2. Sequence Diagrams

Perfect for documenting API calls, user interactions, and system communication.

````markdown
```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    
    User->>Browser: Click button
    Browser->>Server: API request
    Server-->>Browser: JSON response
    Browser-->>User: Display result
```
````

**Arrow Types:**

| Syntax | Description |
|--------|-------------|
| `->>` | Solid line with arrowhead |
| `-->>` | Dotted line with arrowhead |
| `-x` | Solid line with cross |
| `--x` | Dotted line with cross |
| `-)` | Solid line with open arrow |

### 3. Class Diagrams

Document code architecture and relationships.

````markdown
```mermaid
classDiagram
    class JekyllSite {
        +String title
        +Array pages
        +build()
        +serve()
    }
    
    class Page {
        +String content
        +Hash frontMatter
        +render()
    }
    
    JekyllSite --> Page : contains
```
````

### 4. State Diagrams

Model state machines and workflows.

````markdown
```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review : Submit
    Review --> Published : Approve
    Review --> Draft : Reject
    Published --> [*]
```
````

### 5. Entity Relationship Diagrams

Document database schemas.

````markdown
```mermaid
erDiagram
    POST ||--o{ TAG : has
    POST {
        string title
        string content
        date published_at
    }
    TAG {
        string name
        string slug
    }
```
````

### 6. Pie Charts

Visualize data distributions.

````markdown
```mermaid
pie title Page Views by Section
    "Blog" : 45
    "Docs" : 30
    "Tutorials" : 15
    "About" : 10
```
````

### 7. Gantt Charts

Project timelines and schedules.

````markdown
```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Research        :a1, 2026-01-01, 30d
    Design          :a2, after a1, 20d
    section Phase 2
    Development     :a3, after a2, 45d
    Testing         :a4, after a3, 15d
```
````

### 8. Git Graphs

Visualize Git branching and commits.

````markdown
```mermaid
gitGraph
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout main
    merge feature
    commit
```
````

---

## Syntax Options

### Option A: Native Markdown (Recommended)

Use fenced code blocks — cleanest and most portable:

````markdown
```mermaid
graph TD
    A --> B
```
````

### Option B: HTML Div

Use `<div class="mermaid">` — works when markdown doesn't:

```html
<div class="mermaid">
graph TD
    A --> B
</div>
```

### When to Use Each

| Use Case | Recommended |
|----------|-------------|
| Normal documentation | Markdown code blocks |
| Complex diagrams | HTML div |
| Nested in HTML | HTML div |
| Maximum portability | Markdown code blocks |

---

## Styling and Themes

### Available Themes

Mermaid supports several built-in themes:

```javascript
mermaid.initialize({
  theme: 'default'  // or 'forest', 'dark', 'neutral', 'base'
});
```

| Theme | Description |
|-------|-------------|
| `default` | Blue color scheme |
| `forest` | Green color scheme |
| `dark` | Dark background |
| `neutral` | Grayscale |
| `base` | Minimal styling |

---

## Troubleshooting

### Diagram Not Rendering

| Symptom | Solution |
|---------|----------|
| Raw code shown | Add `mermaid: true` to front matter |
| Blank space | Check syntax in [Live Editor](https://mermaid.live/) |
| Script not loading | Verify CDN URL in `_config.yml` |
| Partial render | Check for syntax errors |

### Common Syntax Errors

```markdown
Wrong: graph TD A -> B      (single arrow)
Right: graph TD A --> B     (double arrow)

Wrong: graph TD A[Text]B    (no arrow between nodes)
Right: graph TD A[Text] --> B

Wrong: flowchart TD         (in older Mermaid versions)
Right: graph TD             (more compatible)
```

### Testing Locally

```bash
# Start Jekyll dev server
docker-compose up

# Check browser console for errors
# Open http://localhost:4000/your-page
```

---

## Best Practices

1. **Only enable when needed** — use `mermaid: true` only on pages with diagrams
2. **Keep diagrams simple** — complex diagrams slow rendering
3. **Test in Live Editor** — use [mermaid.live](https://mermaid.live/) first
4. **Add descriptions** — complex diagrams need text explanations
5. **Use clear labels** — avoid abbreviations

---

## Resources

- **Mermaid Documentation**: [mermaid.js.org](https://mermaid.js.org/)
- **Live Editor**: [mermaid.live](https://mermaid.live/)
- **Syntax Reference**: [Mermaid Syntax](https://mermaid.js.org/intro/syntax-reference.html)
- **Theme Configuration**: [Mermaid Theming](https://mermaid.js.org/config/theming.html)

---

*This guide is part of the [Zer0-Mistakes Jekyll Theme](https://github.com/bamr87/zer0-mistakes) documentation.*
