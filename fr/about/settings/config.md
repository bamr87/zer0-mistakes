---
title: Utilitaire de configuration
preview: "/images/previews/configuration-utility.png"
layout: admin
icon: bi-gear
excerpt: Visualisez, gérez et mettez à jour la configuration de votre thème Jekyll
  depuis un seul endroit.
lastmod: 2026-04-04 00:00:00.000000000 Z
config-dir: pages/_about/settings
config-file: _config.yml
sidebar: false
lang: fr
permalink: "/fr/about/config/"
translation_of: pages/_about/settings/config.md
translation_source_url: "/about/config/"
machine_translated: true
translated_from_sha: 2428cd280d39
---

{% comment %}
Rendu de configuration assaini partagé (T-009/T-018). L'onglet Raw-YAML visible et l'élément masqué de copie de source utilisent tous deux cette capture, de sorte que la clé PostHog active (et toute autre ligne ressemblant à un secret) n'atteint jamais le DOM, ni à un endroit ni à l'autre. Filtre de ligne Liquid pur (fonctionne sur GitHub Pages où le filtre de plugin sanitize_config_yaml est un no-op silencieux) + le filtre de plugin comme défense en profondeur sur les builds avec plugins activés. cfg_nl capture exactement un saut de ligne — gardez les deux balises collées à gauche. Fail-closed : si la séparation s'est dégradée, toute la configuration correspond à la sonde et s'affiche comme un seul marqueur de rédaction. Les lignes sont échappées en HTML ; les boutons de copie lisent textContent, qui décode les entités vers les caractères d'origine.
{% endcomment %}
{% capture cfg_full_raw %}{% include_relative _config.yml %}{% endcapture %}
{% capture cfg_nl %}
{% endcapture %}{% assign cfg_lines = cfg_full_raw | split: cfg_nl %}
{% capture cfg_sanitized %}{% for cfg_line in cfg_lines %}{% assign cfg_probe = cfg_line | downcase %}{% if cfg_probe contains 'api_key' or cfg_probe contains 'secret' or cfg_probe contains 'password' or cfg_probe contains 'token' or cfg_probe contains 'phc_' %}# [expurgé]{% else %}{{ cfg_line | sanitize_config_yaml | escape }}{% endif %}
{% endfor %}{% endcapture %}


<!-- Quick-reference cards -->
<div class="row g-3 mb-4">
  <div class="col-6 col-lg-3">
    <div class="card text-center h-100 border-primary">
      <div class="card-body py-3">
        <i class="bi bi-globe fs-3 text-primary"></i>
        <div class="fw-semibold mt-1 text-truncate" title="{{ site.url }}">{{ site.url }}</div>
        <small class="text-muted">URL du site</small>
      </div>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card text-center h-100 border-primary">
      <div class="card-body py-3">
        <i class="bi bi-github fs-3 text-primary"></i>
        <div class="fw-semibold mt-1 text-truncate">{{ site.github_user }}/{{ site.repository_name }}</div>
        <small class="text-muted">Dépôt</small>
      </div>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card text-center h-100 border-primary">
      <div class="card-body py-3">
        <i class="bi bi-palette fs-3 text-primary"></i>
        <div class="fw-semibold mt-1">{{ site.theme_skin | default: "dark" | capitalize }}</div>
        <small class="text-muted">Thème visuel</small>
      </div>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card text-center h-100 border-primary">
      <div class="card-body py-3">
        <i class="bi bi-collection fs-3 text-primary"></i>
        <div class="fw-semibold mt-1">{{ site.collections | size }}</div>
        <small class="text-muted">Collections</small>
      </div>
    </div>
  </div>
</div>

<!-- Main tabbed interface -->
<ul class="nav nav-tabs" id="configTabs" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" id="tab-view" data-bs-toggle="tab" data-bs-target="#pane-view" type="button" role="tab" aria-selected="true">
      <i class="bi bi-eye me-1"></i> Voir la config
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-edit" data-bs-toggle="tab" data-bs-target="#pane-edit" type="button" role="tab" aria-selected="false">
      <i class="bi bi-pencil-square me-1"></i> Modifier et exporter
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-raw" data-bs-toggle="tab" data-bs-target="#pane-raw" type="button" role="tab" aria-selected="false">
      <i class="bi bi-file-earmark-code me-1"></i> YAML brut
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab-actions" data-bs-toggle="tab" data-bs-target="#pane-actions" type="button" role="tab" aria-selected="false">
      <i class="bi bi-terminal me-1"></i> Actions rapides
    </button>
  </li>
</ul>

<div class="tab-content pt-4" id="configTabContent">

  <!-- ═══════ View Tab ═══════ -->
  <div class="tab-pane fade show active" id="pane-view" role="tabpanel">
    {% include components/config-viewer.html %}
  </div>

  <!-- ═══════ Edit Tab ═══════ -->
  <div class="tab-pane fade" id="pane-edit" role="tabpanel">
    {% include components/config-editor.html %}
  </div>

  <!-- ═══════ Raw YAML Tab ═══════ -->
  <div class="tab-pane fade" id="pane-raw" role="tabpanel">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0"><i class="bi bi-filetype-yml me-1"></i> _config.yml</h5>
      <button class="btn btn-sm btn-outline-primary" id="cfg-copy-raw" title="Copy full YAML">
        <i class="bi bi-clipboard"></i> Copier
      </button>
    </div>
    <pre class="bg-dark text-light p-3 rounded" style="max-height:600px;overflow:auto;font-size:.8rem"><code id="cfg-raw-yaml">{{ cfg_sanitized }}</code></pre>
  </div>

  <!-- ═══════ Quick Actions Tab ═══════ -->
  <div class="tab-pane fade" id="pane-actions" role="tabpanel">

    <div class="row g-4">
      <!-- Regenerate commands -->
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-arrow-repeat me-1"></i> Régénérer la config</div>
          <div class="card-body">
            <p class="small text-muted">Copiez le <code>_config.yml</code> actif dans ce répertoire de paramètres à des fins de documentation.</p>

            <h6 class="mt-3"><i class="bi bi-terminal me-1"></i> Bash</h6>
```bash
cd ~/github/{{ site.local_repo }}
# Wraps the copy in Liquid raw markers so config comments that mention
# Liquid tags render literally (scripts/bin/validate checks for drift).
# The awk string-splits keep this page itself Liquid-safe.
awk 'BEGIN{print "{" "% raw %" "}"} {print} END{print "{" "% endraw %" "}"}' \
  {{ page.config-file }} > {{ page.config-dir }}/{{ page.config-file }}
```

<h6 class="mt-3"><i class="bi bi-windows me-1"></i> PowerShell</h6>

```powershell
cd ~/github/{{ site.local_repo }}
$raw = "{" + "% raw %" + "}"; $end = "{" + "% endraw %" + "}"
$body = Get-Content {{ page.config-file }} -Raw
Set-Content -Encoding UTF8 {{ page.config-dir }}/{{ page.config-file }} `
  -Value ($raw + "`n" + $body + $end + "`n")
```
          </div>
        </div>
      </div>

      <!-- Useful shortcuts -->
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-lightning-charge me-1"></i> Raccourcis</div>
          <div class="card-body">
            <div class="list-group list-group-flush">
              <a href="https://github.com/{{ site.github_user }}/{{ site.repository_name }}/blob/{{ site.branch }}/_config.yml"
                 class="list-group-item list-group-item-action d-flex align-items-center" target="_blank" rel="noopener">
                <i class="bi bi-github me-2"></i>
                <div>
                  <div class="fw-semibold">Voir sur GitHub</div>
                  <small class="text-muted">Ouvrir _config.yml dans le dépôt</small>
                </div>
              </a>
              <a href="https://github.com/{{ site.github_user }}/{{ site.repository_name }}/edit/{{ site.branch }}/_config.yml"
                 class="list-group-item list-group-item-action d-flex align-items-center" target="_blank" rel="noopener">
                <i class="bi bi-pencil me-2"></i>
                <div>
                  <div class="fw-semibold">Modifier sur GitHub</div>
                  <small class="text-muted">Ouvrir l'éditeur dans le navigateur</small>
                </div>
              </a>
              <a href="https://jekyllrb.com/docs/configuration/"
                 class="list-group-item list-group-item-action d-flex align-items-center" target="_blank" rel="noopener">
                <i class="bi bi-book me-2"></i>
                <div>
                  <div class="fw-semibold">Documentation Jekyll</div>
                  <small class="text-muted">Référence de configuration officielle</small>
                </div>
              </a>
              <a href="https://yaml.org/spec/1.2.2/"
                 class="list-group-item list-group-item-action d-flex align-items-center" target="_blank" rel="noopener">
                <i class="bi bi-filetype-yml me-2"></i>
                <div>
                  <div class="fw-semibold">Spécification YAML</div>
                  <small class="text-muted">Spécification YAML 1.2.2</small>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Environment info -->
      <div class="col-12">
        <div class="card">
          <div class="card-header"><i class="bi bi-hdd-network me-1"></i> Environnement</div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm table-hover mb-0 align-middle">
                <tbody>
                  <tr>
                    <td class="fw-semibold" style="width:200px"><code>jekyll.environment</code></td>
                    <td>
                      {% if jekyll.environment == "production" %}
                        <span class="badge bg-success">production</span>
                      {% else %}
                        <span class="badge bg-warning text-dark">{{ jekyll.environment }}</span>
                      {% endif %}
                    </td>
                  </tr>
                  <tr>
                    <td class="fw-semibold"><code>site.url</code></td>
                    <td><a href="{{ site.url }}" target="_blank" rel="noopener">{{ site.url }}</a></td>
                  </tr>
                  <tr>
                    <td class="fw-semibold"><code>site.baseurl</code></td>
                    <td><code>{{ site.baseurl | default: "(empty)" }}</code></td>
                  </tr>
                  <tr>
                    <td class="fw-semibold"><code>site.remote_theme</code></td>
                    <td><code>{{ site.remote_theme | default: "false" }}</code></td>
                  </tr>
                  <tr>
                    <td class="fw-semibold"><code>site.port</code></td>
                    <td><code>{{ site.port }}</code></td>
                  </tr>
                  <tr>
                    <td class="fw-semibold"><code>site.collections_dir</code></td>
                    <td><code>{{ site.collections_dir }}</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- Hidden full YAML used by the viewer's "Copy Full Config" button.
     Same sanitized render as the Raw-YAML tab (see capture at page top). -->
<pre id="cfg-full-yaml" class="d-none">{{ cfg_sanitized }}</pre>

<!-- Config Utility JS (must load after DOM) -->
<script src="{{ '/assets/js/config-utility.js' | relative_url }}" defer></script>
<!-- Copy for Raw tab -->
<script>
document.addEventListener('DOMContentLoaded', function() { var rawCopyBtn = document.getElementById('cfg-copy-raw'); if (rawCopyBtn) {
    rawCopyBtn.addEventListener('click', function() {
      var code = document.getElementById('cfg-raw-yaml');
      if (!code) return;
      var orig = rawCopyBtn.innerHTML;
      navigator.clipboard.writeText(code.textContent).then(function() {
        rawCopyBtn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
        setTimeout(function() { rawCopyBtn.innerHTML = orig; }, 1800);
      });
    });
} });
</script>
