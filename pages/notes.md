---
title: "Notes"
description: "Quick reference notes, cheatsheets, and command snippets for developers"
layout: default
permalink: /notes/
---

<div class="container-fluid">
  <div class="row mb-4">
    <div class="col">
      <h1 class="display-5"><i class="bi bi-sticky-fill me-2"></i>Notes</h1>
      <p class="lead text-muted">Quick reference notes, cheatsheets, and command snippets for developers</p>
    </div>
  </div>

  {% if site.notes and site.notes.size > 0 %}
  
  <!-- Tag Filter -->
  <div class="row mb-4">
    <div class="col">
      <div class="d-flex flex-wrap gap-2 align-items-center">
        <span class="text-muted me-2">Filter by tag:</span>
        <button class="btn btn-sm btn-outline-secondary active" data-filter="all">All</button>
        {% assign all_tags = "" | split: "" %}
        {% for note in site.notes %}
          {% for tag in note.tags %}
            {% unless all_tags contains tag %}
              {% assign all_tags = all_tags | push: tag %}
            {% endunless %}
          {% endfor %}
        {% endfor %}
        {% assign sorted_tags = all_tags | sort %}
        {% for tag in sorted_tags %}
        <button class="btn btn-sm btn-outline-primary" data-filter="{{ tag }}">{{ tag }}</button>
        {% endfor %}
      </div>
    </div>
  </div>

  <!-- Notes Grid -->
  <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4" id="notes-grid">
    {% assign sorted_notes = site.notes | sort: "date" | reverse %}
    {% for note in sorted_notes %}
    <div class="col note-card" data-tags="{{ note.tags | join: ' ' }}">
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0">
              <a href="{{ note.url | relative_url }}" class="text-decoration-none stretched-link">
                {{ note.title | default: note.name }}
              </a>
            </h5>
            {% if note.difficulty %}
            <span class="badge bg-{% if note.difficulty == 'beginner' %}success{% elsif note.difficulty == 'intermediate' %}warning{% else %}danger{% endif %}">
              {{ note.difficulty }}
            </span>
            {% endif %}
          </div>
          
          {% if note.description %}
          <p class="card-text text-muted small">{{ note.description | truncate: 120 }}</p>
          {% endif %}
          
          {% if note.tags and note.tags.size > 0 %}
          <div class="mt-auto">
            {% for tag in note.tags limit: 4 %}
            <span class="badge bg-light text-dark border me-1">{{ tag }}</span>
            {% endfor %}
            {% if note.tags.size > 4 %}
            <span class="badge bg-light text-muted">+{{ note.tags.size | minus: 4 }}</span>
            {% endif %}
          </div>
          {% endif %}
        </div>
        <div class="card-footer bg-transparent border-top-0">
          <small class="text-muted">
            <i class="bi bi-calendar3 me-1"></i>
            {{ note.date | date: "%b %d, %Y" }}
            {% if note.read_time %}
            <span class="ms-2"><i class="bi bi-clock me-1"></i>{{ note.read_time }} min</span>
            {% endif %}
          </small>
        </div>
      </div>
    </div>
    {% endfor %}
  </div>
  
  {% else %}
  <div class="row">
    <div class="col">
      <div class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i>
        No notes published yet. Check back soon!
      </div>
    </div>
  </div>
  {% endif %}
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const filterButtons = document.querySelectorAll('[data-filter]');
  const noteCards = document.querySelectorAll('.note-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Filter cards
      noteCards.forEach(card => {
        const tags = card.getAttribute('data-tags') || '';
        if (filter === 'all' || tags.includes(filter)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
});
</script>
