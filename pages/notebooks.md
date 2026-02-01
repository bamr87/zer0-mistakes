---
title: "Notebooks"
description: "Interactive Jupyter notebooks with tutorials and data analysis examples"
layout: default
permalink: /notebooks/
---

<div class="container-fluid">
  <div class="row mb-4">
    <div class="col">
      <h1 class="display-5"><i class="bi bi-journal-code me-2"></i>Notebooks</h1>
      <p class="lead text-muted">Interactive Jupyter notebooks with tutorials, data analysis, and code examples</p>
    </div>
  </div>

  {% if site.notebooks and site.notebooks.size > 0 %}
  
  <!-- Difficulty Filter -->
  <div class="row mb-4">
    <div class="col">
      <div class="d-flex flex-wrap gap-2 align-items-center">
        <span class="text-muted me-2">Filter by difficulty:</span>
        <button class="btn btn-sm btn-outline-secondary active" data-filter="all">All</button>
        <button class="btn btn-sm btn-outline-success" data-filter="beginner">
          <i class="bi bi-star"></i> Beginner
        </button>
        <button class="btn btn-sm btn-outline-warning" data-filter="intermediate">
          <i class="bi bi-star-half"></i> Intermediate
        </button>
        <button class="btn btn-sm btn-outline-danger" data-filter="advanced">
          <i class="bi bi-stars"></i> Advanced
        </button>
      </div>
    </div>
  </div>

  <!-- Notebooks Grid -->
  <div class="row row-cols-1 row-cols-md-2 g-4" id="notebooks-grid">
    {% assign sorted_notebooks = site.notebooks | sort: "date" | reverse %}
    {% for nb in sorted_notebooks %}
    {% unless nb.path contains '.ipynb' %}
    <div class="col notebook-card" data-difficulty="{{ nb.difficulty | default: 'intermediate' }}">
      <div class="card h-100 shadow-sm">
        <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <span>
            <i class="bi bi-journal-code me-2"></i>
            Jupyter Notebook
          </span>
          <span class="badge bg-{% if nb.difficulty == 'beginner' %}success{% elsif nb.difficulty == 'intermediate' %}warning text-dark{% else %}danger{% endif %}">
            {{ nb.difficulty | default: 'intermediate' | capitalize }}
          </span>
        </div>
        <div class="card-body">
          <h5 class="card-title">
            <a href="{{ nb.url | relative_url }}" class="text-decoration-none stretched-link">
              {{ nb.title | default: nb.name }}
            </a>
          </h5>
          
          {% if nb.description %}
          <p class="card-text text-muted">{{ nb.description | truncate: 150 }}</p>
          {% endif %}
          
          {% if nb.tags and nb.tags.size > 0 %}
          <div class="mb-3">
            {% for tag in nb.tags limit: 5 %}
            <span class="badge bg-primary bg-opacity-10 text-primary me-1">{{ tag }}</span>
            {% endfor %}
          </div>
          {% endif %}
        </div>
        <div class="card-footer bg-transparent">
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              <i class="bi bi-calendar3 me-1"></i>{{ nb.date | date: "%b %d, %Y" }}
            </small>
            <div>
              {% assign ipynb_path = nb.path | replace: '.md', '.ipynb' %}
              <a href="{{ '/pages/_notebooks/' | append: nb.name | append: '.ipynb' | relative_url }}" 
                 class="btn btn-sm btn-outline-secondary position-relative"
                 onclick="event.stopPropagation();">
                <i class="bi bi-download me-1"></i>.ipynb
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    {% endunless %}
    {% endfor %}
  </div>
  
  {% else %}
  <div class="row">
    <div class="col">
      <div class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i>
        No notebooks published yet. Check back soon!
      </div>
    </div>
  </div>
  {% endif %}
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const filterButtons = document.querySelectorAll('[data-filter]');
  const notebookCards = document.querySelectorAll('.notebook-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Filter cards
      notebookCards.forEach(card => {
        const difficulty = card.getAttribute('data-difficulty') || 'intermediate';
        if (filter === 'all' || difficulty === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
});
</script>
