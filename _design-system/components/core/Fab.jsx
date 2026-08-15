import React from "react";

/**
 * zer0-mistakes Fab — the circular floating action button used by the
 * bottom-right utility stack (back-to-top, chat, TOC, local-graph). Sized and
 * layered entirely by --zer0-space-fab-* / --zer0-shadow-fab / --zer0-layer-*
 * tokens.
 */
export function Fab({
  icon = "arrow-up",
  label,
  size = "md",
  variant = "primary",
  href,
  onClick,
  style,
  ...rest
}) {
  const [lift, setLift] = React.useState(false);
  const dim = size === "sm" ? "2.75rem" : "var(--zer0-space-fab-size)";
  const palettes = {
    primary: { bg: "var(--zer0-color-primary)", fg: "#fff", bd: "transparent" },
    light: {
      bg: "var(--zer0-color-bg-elevated)",
      fg: "var(--zer0-color-primary)",
      bd: "var(--zer0-color-border)",
    },
  };
  const p = palettes[variant] || palettes.primary;
  const css = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: dim,
    height: dim,
    padding: 0,
    border: `1px solid ${p.bd}`,
    borderRadius: "var(--zer0-radius-circle)",
    background: p.bg,
    color: p.fg,
    fontSize: size === "sm" ? "1.1rem" : "1.35rem",
    cursor: "pointer",
    boxShadow: "var(--zer0-shadow-fab)",
    opacity: lift ? 1 : 0.92,
    transform: lift ? "translateY(-2px)" : "none",
    textDecoration: "none",
    transition:
      "opacity var(--zer0-motion-duration-fast) var(--zer0-motion-ease-standard), transform var(--zer0-motion-duration-fast) var(--zer0-motion-ease-standard), box-shadow var(--zer0-motion-duration-fast) var(--zer0-motion-ease-standard)",
    ...style,
  };
  const handlers = {
    onMouseEnter: () => setLift(true),
    onMouseLeave: () => setLift(false),
    onFocus: (e) => { e.currentTarget.style.boxShadow = "var(--zer0-shadow-focus), var(--zer0-shadow-fab)"; },
    onBlur: (e) => { e.currentTarget.style.boxShadow = "var(--zer0-shadow-fab)"; },
  };
  const ic = <i className={`bi bi-${icon}`} aria-hidden="true" />;
  if (href) {
    return (
      <a href={href} aria-label={label} title={label} style={css} onClick={onClick} {...handlers} {...rest}>
        {ic}
      </a>
    );
  }
  return (
    <button type="button" aria-label={label} title={label} style={css} onClick={onClick} {...handlers} {...rest}>
      {ic}
    </button>
  );
}

/**
 * zer0-mistakes FabStack — pins its children in the theme's bottom-right FAB
 * column (newest on top), spaced by --zer0-space-fab-gap and offset by
 * --zer0-space-fab-offset. Set `fixed={false}` to position absolutely inside a
 * demo container instead of the viewport.
 */
export function FabStack({ children, fixed = true, style, ...rest }) {
  const css = {
    position: fixed ? "fixed" : "absolute",
    bottom: "var(--zer0-space-fab-offset)",
    right: "var(--zer0-space-fab-offset)",
    display: "flex",
    flexDirection: "column-reverse",
    gap: "var(--zer0-space-fab-gap)",
    zIndex: "var(--zer0-layer-fab-back-to-top)",
    ...style,
  };
  return (
    <div style={css} {...rest}>
      {children}
    </div>
  );
}
