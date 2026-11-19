---
title: "0003 Missions"
description: "Amendment record that states three product missions in constitution §1."
date: 2026-11-16T00:00:00.000Z
lastmod: 2026-11-16T00:00:00.000Z
categories: [docs]
tags: [governance, amendments]
author: bamr87
---

<!-- kit: governance v0.1.0 -->
# 0003 — Missions

- **Status:** proposed
- **Date:** 2026-11-16
- **Proposed by:** Grok Bot (agent), at the maintainer's request
- **Ratified by:**
- **Affects:** constitution §1; docs/architecture/prd-requirements.md §1.1
- **Supersedes:** none
- **Related:** [docs/architecture/prd-requirements.md](../architecture/prd-requirements.md) §1.1

## Context

Constitution §1 was a single mission sentence or short paragraph, not one direction statement with exactly three numbered missions. The fleet rule is that every repo's constitution §1 uses that form, adopted through a numbered amendment the maintainer ratifies by merging. Mission 1 is the maintainer's own wording, adapted to this repo: provide data, tools, resources and transparency for all stakeholders, practitioners in the domain, and the general public. The ambition is the direction, not a claim that the work is already finished.

The earlier §1 text was:

> Create the most developer-friendly Jekyll theme that eliminates setup friction through intelligent automation, delivers enterprise-grade features with privacy-first principles, and empowers both human developers and AI agents to build beautiful, functional websites without configuration complexity.

## Amendment

Retitle constitution §1 **Missions**. Replace the body of §1 with the following. Any invariants or other normative rules that already lived outside §1 are unchanged.

zer0-mistakes's direction is to become the ultimate open home for all things Jekyll themes and GitHub Pages craft — data, tools, resources and transparency, gathered in one place that anyone can inspect and reuse.

1. **Provide data, tools, resources and transparency for all stakeholders, developers, technical writers, theme practitioners and the general public.** Developers, technical writers, content creators, open-source projects, AI agents, and the general public are first-class audiences. The aim is a shared, open commons: the same sources, the same tools, and the same trail of evidence for everyone.
2. **Eliminate setup friction through intelligent automation, Docker-first development and zero-configuration deployment, while delivering enterprise-grade features with privacy-first principles.** Consent-based analytics, no surprise telemetry, and a theme that works immediately on GitHub Pages are part of that path. The theme is published as a Ruby gem and a remote theme, built on Bootstrap 5.
3. **Empower both human developers and AI agents to build beautiful, functional GitHub Pages sites without configuration complexity.** Serve the theme, the install path and the agent-friendly docs so anyone can adopt it — an open toolkit for working with all things Jekyll themes and GitHub Pages craft.

These missions set the course; they do not claim the work is finished. They serve the vision in docs/architecture/prd-requirements.md. The earlier single mission sentence is absorbed into these three. Privacy-first and AI-and-human authoring principles are kept. Every feature must trace to them.

_Source: [architecture/prd-requirements.md](../architecture/prd-requirements.md) §1.1._

## Consequences

Agents and reviewers judge fit against these three missions before inventing scope, treating them as the direction of the repo rather than a description of what already ships. The same text is added as docs/architecture/prd-requirements.md §1.1 so the constitution's `_Source:` line stays accurate. The PRD purpose, goals, feature catalog and invariants outside this addition are unchanged except for a new catalog entry (none) and a regenerated feature-catalog block where the repo already has one. This PR also aligns the README and AGENTS.md one-liners with the missions and links them to constitution §1.
