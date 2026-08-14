// zer0-mistakes website UI kit — Hero
// Solid bg-primary block, white text, display-4 title, CTA cluster, and the
// wizard hero art in a rounded shadowed 4:3 frame. Mirrors _layouts/landing.html.

function Hero() {
  const wrap = {
    background: "var(--zer0-color-primary)",
    color: "#fff",
    padding: "clamp(2.5rem, 6vw, 4.5rem) clamp(1rem, 4vw, 2rem)",
    overflow: "hidden",
  };
  const grid = {
    maxWidth: "var(--zer0-layout-max-width-xl)",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: "clamp(1.5rem, 4vw, 3rem)",
    alignItems: "center",
  };
  return (
    <section style={wrap}>
      <div style={grid} className="hero-grid">
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 600,
                         background: "rgba(255,255,255,0.16)", padding: "0.3rem 0.7rem", borderRadius: "var(--zer0-radius-pill)",
                         marginBottom: "1.1rem" }}>
            <i className="bi bi-stars" /> AI-Native · Bootstrap 5.3 · v1.18.1
          </span>
          <h1 style={{ fontSize: "var(--zer0-text-display-4)", fontWeight: 700, lineHeight: 1.1, margin: "0 0 1rem" }}>
            A modern website theme that just works
          </h1>
          <p style={{ fontSize: "var(--zer0-text-lg)", lineHeight: 1.55, margin: "0 0 1.6rem", maxWidth: "34rem", color: "rgba(255,255,255,0.92)" }}>
            Publish a blog, docs site, or portfolio in under five minutes — no design skills,
            no servers, hosted on GitHub Pages for $0/month.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Button variant="light" size="lg" icon="rocket-takeoff" href="#get-started">Get Started</Button>
            <Button size="lg" icon="list-check" href="#features"
                    style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.6)" }}>
              Features
            </Button>
            <Button size="lg" icon="github" iconPosition="start" href="#"
                    style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.6)" }}>
              GitHub
            </Button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ aspectRatio: "4 / 3", width: "100%", maxWidth: "28rem", borderRadius: "var(--zer0-radius-lg)",
                        overflow: "hidden", boxShadow: "var(--zer0-shadow-lg)" }}>
            <img src="../../assets/images/wizard-on-journey.png" alt="zer0-mistakes — from zero to hero"
                 style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

window.Hero = Hero;
