---
title: "I Bayesian-Modeled My Coffee Intake and Wept With Joy"
description: "Why settle for an average when a hierarchical Bayesian model with partial pooling and posterior predictive checks earns a gloriously credible interval?"
preview: /images/previews/i-bayesian-modeled-my-coffee-intake-and-wept-with-.jpg
date: 2026-06-17T09:00:00.000Z
lastmod: 2026-06-17T09:00:00.000Z
author: vega
layout: article
# Demo of the show_hero flag (#303): render the preview as the article hero
# without promoting the post to featured/breaking (sidebar, typography and
# badges keep their standard post_type defaults).
show_hero: true
categories:
  - Data Science
tags:
  - statistics
  - bayesian
  - data science
  - analytics
keywords:
  - bayesian hierarchical model
  - partial pooling
  - posterior predictive check
  - credible interval
  - mcmc
featured: false
estimated_reading_time: 5 min
draft: false
---

Okay. OKAY. I need you to sit down, because what my espresso machine and I
discovered this weekend is, statistically, one of the most beautiful things I
have ever witnessed.

The question was trivial: *how many cups of coffee do I drink per day?* The
amateur reaches for `mean(cups)`. The amateur gets `3.2` and walks away,
spiritually impoverished. We are not amateurs.

## Why an average is a tragedy

A single mean throws away **everything interesting**: that weekdays and weekends
are different regimes, that some weeks I'm on deadline, that my measurements are
counts and counts are Poisson, you beautiful little events you. So I built a
**Poisson hierarchical model with partial pooling** across days-of-week:

```
cups[i] ~ Poisson(λ[dow[i]])
log(λ[d]) = μ + b[d]
b[d]      ~ Normal(0, σ)      # partial pooling — the magic!!
μ         ~ Normal(1, 1)
σ         ~ HalfNormal(1)
```

Partial pooling means Tuesday *borrows strength* from Saturday. They share. They
care about each other. I think about this more than I should.

## The part where I wept

Four chains, 2,000 warmup, 2,000 sampling. **R-hat = 1.00 across the board** —
chef's kiss — and the effective sample sizes were so healthy I nearly framed the
trace plots. The posterior for weekend λ landed at **4.1 cups, 94% credible
interval [3.3, 5.0]**, cleanly separated from the weekday posterior. That gap is
not noise. That gap is *me, quantified.*

Then the finale: a **posterior predictive check**. I simulated replicated
datasets from the fitted model and overlaid them on reality, and they matched so
snugly I made an involuntary noise. The model didn't just summarize my coffee —
it could *dream plausible new weeks of it.*

For the truly devoted, I also computed the **information criteria**: the
hierarchical model crushed the flat, no-pooling alternative on both WAIC and
leave-one-out cross-validation, with Pareto-k diagnostics so well-behaved I
whispered "good model" out loud to an empty kitchen. Then I propagated the full
posterior into an expected-utility calculation for "should I have one more cup?"
The answer was not a number. The answer was a *distribution*, and it was radiant.

## Was this necessary?

For knowing I drink ~3 cups? No. For the **credible interval, the pooling, the
posterior predictive ballet**? Friends, it was the only thing that has ever truly
been necessary. Compute the AIC of your joy. Mine improved enormously.
