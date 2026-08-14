// zer0-mistakes website UI kit — Navbar
// Fixed-top bar, bg-body-tertiary with a bottom shadow, matching
// _includes/core/header.html: brand cluster, primary nav, utility controls
// (search, theme toggle, skin menu, GitHub).

function Navbar({ theme, onToggleTheme, skin, onSkin }) {
  const [skinOpen, setSkinOpen] = React.useState(false);
  const skins = ["default", "air", "aqua", "dirt", "neon", "mint", "plum", "sunrise"];
  const links = ["Docs", "Features", "Blog", "Roadmap"];

  const bar = {
    position: "sticky",
    top: 0,
    zIndex: "var(--zer0-layer-header)",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    height: "58px",
    padding: "0 clamp(1rem, 4vw, 2rem)",
    background: "var(--zer0-color-bg-elevated)",
    borderBottom: "1px solid var(--zer0-color-border)",
    boxShadow: "var(--zer0-shadow-xs)",
    fontFamily: "var(--zer0-font-sans)",
  };
  const iconBtn = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    borderRadius: "var(--zer0-radius)",
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--zer0-color-ink)",
    cursor: "pointer",
    fontSize: "1.05rem",
  };

  return (
    <header style={bar}>
      {/* Brand */}
      <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", minWidth: 0 }}>
        <img src="../../assets/images/zer0-mistakes-wizard.png" alt="zer0-mistakes"
             width="32" height="32"
             style={{ borderRadius: "var(--zer0-radius)", objectFit: "cover", flex: "none", boxShadow: "var(--zer0-shadow-xs)" }} />
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, color: "var(--zer0-color-ink)", fontSize: "1rem" }}>zer0-mistakes</span>
          <span style={{ fontSize: "0.7rem", color: "var(--zer0-color-ink-muted)" }} className="hide-sm">AI-Native Jekyll Theme</span>
        </span>
      </a>

      {/* Primary nav */}
      <nav style={{ display: "flex", gap: "0.25rem", marginLeft: "0.5rem" }} className="hide-md">
        {links.map((l, i) => (
          <a key={l} href="#"
             style={{ padding: "0.4rem 0.7rem", borderRadius: "var(--zer0-radius)", textDecoration: "none",
                      fontSize: "0.92rem", fontWeight: 500,
                      color: i === 0 ? "var(--zer0-color-primary)" : "var(--zer0-color-ink)" }}>
            {l}
          </a>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Utility controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
        <button style={{ ...iconBtn, width: "auto", padding: "0 0.7rem", gap: "0.4rem",
                         border: "1px solid var(--zer0-color-border)", color: "var(--zer0-color-ink-muted)" }}
                title="Search (press /)">
          <i className="bi bi-search" />
          <kbd style={{ fontFamily: "var(--zer0-font-mono)", fontSize: "0.7rem", background: "var(--zer0-color-bg-muted)",
                        padding: "0.05rem 0.35rem", borderRadius: "4px", color: "var(--zer0-color-ink-muted)" }}>/</kbd>
        </button>

        <button style={iconBtn} onClick={onToggleTheme} title="Toggle light / dark">
          <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon-stars"}`} />
        </button>

        <div style={{ position: "relative" }}>
          <button style={iconBtn} onClick={() => setSkinOpen((o) => !o)} title="Theme skin">
            <i className="bi bi-palette" />
          </button>
          {skinOpen && (
            <div style={{ position: "absolute", right: 0, top: "44px", background: "var(--zer0-color-bg)",
                          border: "1px solid var(--zer0-color-border)", borderRadius: "var(--zer0-radius-lg)",
                          boxShadow: "var(--zer0-shadow-lg)", padding: "0.4rem", width: "170px", zIndex: 50 }}>
              {skins.map((s) => (
                <button key={s}
                        onClick={() => { onSkin(s); setSkinOpen(false); }}
                        style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%",
                                 padding: "0.4rem 0.5rem", border: "none", background: skin === s ? "var(--zer0-color-bg-muted)" : "transparent",
                                 borderRadius: "var(--zer0-radius)", cursor: "pointer", color: "var(--zer0-color-ink)",
                                 fontFamily: "inherit", fontSize: "0.88rem", textTransform: "capitalize" }}>
                  <span style={{ width: "16px", height: "16px", borderRadius: "50%", flex: "none",
                                 background: s === "default" ? "#007bff" : "var(--zer0-color-primary)",
                                 outline: "1px solid var(--zer0-color-border)" }}
                        data-theme-skin={s === "default" ? undefined : s} />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button variant="primary" size="sm" icon="github" href="#" style={{ marginLeft: "0.3rem" }} className="hide-sm">Star</Button>
      </div>
    </header>
  );
}

window.Navbar = Navbar;
