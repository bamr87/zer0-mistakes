// zer0-mistakes website UI kit — content sections
// Quick-links bar, features grid (reuses FeatureCard), get-started install
// cards, and the footer. Copy lifted from _data/landing.yml + README.md.

function QuickLinks() {
  const items = [
    { icon: "moon-stars", label: "Light / Dark" },
    { icon: "search", label: "Site Search" },
    { icon: "diagram-3", label: "Mermaid" },
    { icon: "journal-code", label: "Jupyter" },
    { icon: "hexagon", label: "Obsidian Vault" },
    { icon: "shield-lock", label: "Privacy-First" },
  ];
  return (
    <div style={{ background: "var(--zer0-color-bg-elevated)", borderBottom: "1px solid var(--zer0-color-border)",
                  padding: "0.9rem clamp(1rem, 4vw, 2rem)" }}>
      <div style={{ maxWidth: "var(--zer0-layout-max-width-xl)", margin: "0 auto", display: "flex",
                    gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
        {items.map((it) => (
          <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  fontSize: "0.85rem", color: "var(--zer0-color-ink-muted)", fontFamily: "var(--zer0-font-sans)",
                  border: "1px solid var(--zer0-color-border)", borderRadius: "var(--zer0-radius-pill)",
                  padding: "0.3rem 0.8rem", background: "var(--zer0-color-bg)" }}>
            <i className={`bi bi-${it.icon}`} style={{ color: "var(--zer0-color-primary)" }} /> {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Features() {
  const items = [
    { icon: "shield-check", iconBg: "var(--zer0-color-primary)", title: "Error-Free Development",
      description: "Built-in error handling and a self-healing installer ensure a smooth setup every time." },
    { icon: "boxes", iconBg: "var(--zer0-color-success)", title: "Docker-First Approach",
      description: "Cross-platform with zero local config. Works on Apple Silicon, Intel, and Linux." },
    { icon: "lightning-charge", iconBg: "var(--zer0-color-info)", title: "AI-Powered Setup",
      description: "Intelligent automation detects and fixes common issues automatically." },
  ];
  return (
    <section id="features" style={{ background: "var(--zer0-color-bg-elevated)", padding: "var(--zer0-space-section) clamp(1rem, 4vw, 2rem)" }}>
      <div style={{ maxWidth: "var(--zer0-layout-max-width-xl)", margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 2.5rem" }}>
          <h2 style={{ fontSize: "var(--zer0-text-display-5)", fontWeight: 700, margin: "0 0 0.6rem", color: "var(--zer0-color-ink)" }}>
            Why Choose zer0-mistakes?
          </h2>
          <p style={{ fontSize: "var(--zer0-text-lg)", color: "var(--zer0-color-ink-muted)", margin: 0 }}>
            Built for developers who value reliability, simplicity, and modern workflows.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }} className="feat-grid">
          {items.map((it) => <FeatureCard key={it.title} {...it} />)}
        </div>
      </div>
    </section>
  );
}

function GetStarted() {
  const cards = [
    { icon: "github", tag: "Easiest", title: "Fork on GitHub",
      body: "Fork the repo, rename it to <user>.github.io, enable Pages. Zero terminal required.",
      cta: "Fork repo" },
    { icon: "file-earmark-code", tag: "3 files", title: "Remote-theme starter",
      body: "_config.yml + Gemfile + index.md. The theme loads over the network — nothing to download.",
      cta: "Copy starter" },
    { icon: "terminal", tag: "Local", title: "Docker one-liner",
      body: "curl … install.sh | bash, then docker-compose up. Self-healing, ~95% success rate.",
      cta: "Run installer" },
  ];
  return (
    <section id="get-started" style={{ padding: "var(--zer0-space-section) clamp(1rem, 4vw, 2rem)" }}>
      <div style={{ maxWidth: "var(--zer0-layout-max-width-xl)", margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: "40rem", margin: "0 auto 2.5rem" }}>
          <h2 style={{ fontSize: "var(--zer0-text-display-5)", fontWeight: 700, margin: "0 0 0.6rem", color: "var(--zer0-color-ink)" }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: "var(--zer0-text-lg)", color: "var(--zer0-color-ink-muted)", margin: 0 }}>
            Choose your path and be up and running in minutes.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }} className="feat-grid">
          {cards.map((c) => (
            <Card key={c.title} hover style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <i className={`bi bi-${c.icon}`} style={{ fontSize: "1.6rem", color: "var(--zer0-color-primary)" }} />
                <Badge variant="subtle">{c.tag}</Badge>
              </div>
              <h3 style={{ margin: 0, fontSize: "var(--zer0-text-h5)", fontWeight: 600, color: "var(--zer0-color-ink)" }}>{c.title}</h3>
              <p style={{ margin: 0, color: "var(--zer0-color-ink-muted)", lineHeight: 1.5, flex: 1, fontSize: "0.92rem" }}>{c.body}</p>
              <Button variant="outline-primary" size="sm" icon="arrow-right" iconPosition="end" href="#">{c.cta}</Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { h: "Product", links: ["Features", "Roadmap", "Changelog", "Live Demo"] },
    { h: "Docs", links: ["Get Started", "Customization", "Design Tokens", "JS API"] },
    { h: "Community", links: ["GitHub", "Discussions", "Issues", "Contributing"] },
  ];
  return (
    <footer style={{ background: "var(--zer0-color-bg-elevated)", borderTop: "1px solid var(--zer0-color-border)",
                     padding: "var(--zer0-space-5) clamp(1rem, 4vw, 2rem) 1.5rem", fontFamily: "var(--zer0-font-sans)" }}>
      <div style={{ maxWidth: "var(--zer0-layout-max-width-xl)", margin: "0 auto", display: "grid",
                    gridTemplateColumns: "1.6fr repeat(3, 1fr)", gap: "2rem" }} className="foot-grid">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
            <img src="../../assets/images/zer0-mistakes-wizard.png" alt="" width="30" height="30"
                 style={{ borderRadius: "var(--zer0-radius)", objectFit: "cover" }} />
            <strong style={{ color: "var(--zer0-color-ink)" }}>zer0-mistakes</strong>
          </div>
          <p style={{ color: "var(--zer0-color-ink-muted)", fontSize: "0.9rem", lineHeight: 1.55, margin: "0 0 0.8rem", maxWidth: "22rem" }}>
            AI-native Jekyll theme for GitHub Pages. From zero to hero — free, open source, MIT licensed.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["github", "rss", "envelope"].map((i) => (
              <a key={i} href="#" style={{ width: "34px", height: "34px", borderRadius: "var(--zer0-radius)",
                     display: "inline-flex", alignItems: "center", justifyContent: "center",
                     border: "1px solid var(--zer0-color-border)", color: "var(--zer0-color-ink-muted)", textDecoration: "none" }}>
                <i className={`bi bi-${i}`} />
              </a>
            ))}
          </div>
        </div>
        {cols.map((col) => (
          <div key={col.h}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                          color: "var(--zer0-color-ink-muted)", marginBottom: "0.8rem" }}>{col.h}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {col.links.map((l) => (
                <li key={l}><a href="#" style={{ color: "var(--zer0-color-link)", textDecoration: "none", fontSize: "0.9rem" }}>{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: "var(--zer0-layout-max-width-xl)", margin: "1.8rem auto 0", paddingTop: "1.2rem",
                    borderTop: "1px solid var(--zer0-color-border)", display: "flex", justifyContent: "space-between",
                    flexWrap: "wrap", gap: "0.5rem", fontSize: "0.82rem", color: "var(--zer0-color-ink-muted)" }}>
        <span>© 2026 zer0-mistakes · MIT License</span>
        <span>Built with this exact theme · 95+ Lighthouse</span>
      </div>
    </footer>
  );
}

Object.assign(window, { QuickLinks, Features, GetStarted, Footer });
