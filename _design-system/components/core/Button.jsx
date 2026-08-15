import React from "react";

/**
 * zer0-mistakes Button — a Bootstrap 5.3 themed button driven by --zer0-color-*
 * tokens. Renders as <button> or, when `href` is set, as <a>.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "start",
  disabled = false,
  href,
  type = "button",
  onClick,
  style,
  ...rest
}) {
  const pad =
    size === "lg"
      ? "0.5rem 1rem"
      : size === "sm"
      ? "0.25rem 0.5rem"
      : "0.375rem 0.75rem";
  const fontSize =
    size === "lg" ? "1.125rem" : size === "sm" ? "0.875rem" : "1rem";

  const palettes = {
    primary: { bg: "var(--zer0-color-primary)", bd: "var(--zer0-color-primary)", fg: "#fff" },
    secondary: { bg: "var(--zer0-color-secondary)", bd: "var(--zer0-color-secondary)", fg: "#fff" },
    light: { bg: "var(--zer0-color-bg-elevated)", bd: "var(--zer0-color-border)", fg: "var(--zer0-color-ink)" },
    "outline-primary": { bg: "transparent", bd: "var(--zer0-color-primary)", fg: "var(--zer0-color-primary)" },
    ghost: { bg: "transparent", bd: "transparent", fg: "var(--zer0-color-primary)" },
  };
  const p = palettes[variant] || palettes.primary;

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.45em",
    fontFamily: "var(--zer0-font-sans)",
    fontWeight: "var(--zer0-font-weight-medium)",
    fontSize,
    lineHeight: 1.5,
    padding: pad,
    color: p.fg,
    background: p.bg,
    border: `1px solid ${p.bd}`,
    borderRadius: "var(--zer0-radius)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    textDecoration: "none",
    transition:
      "background-color var(--zer0-motion-duration-fast) var(--zer0-motion-ease-standard), transform var(--zer0-motion-duration-fast) var(--zer0-motion-ease-standard), box-shadow var(--zer0-motion-duration-fast) var(--zer0-motion-ease-standard)",
    ...style,
  };

  const onEnter = (e) => {
    if (disabled) return;
    if (variant === "outline-primary" || variant === "ghost") {
      e.currentTarget.style.background = "var(--zer0-color-primary)";
      e.currentTarget.style.color = "#fff";
    } else if (variant === "primary") {
      e.currentTarget.style.background = "color-mix(in srgb, var(--zer0-color-primary) 85%, var(--zer0-color-accent))";
    } else {
      e.currentTarget.style.filter = "brightness(0.96)";
    }
  };
  const onLeave = (e) => {
    e.currentTarget.style.background = p.bg;
    e.currentTarget.style.color = p.fg;
    e.currentTarget.style.filter = "none";
  };
  const onFocus = (e) => { e.currentTarget.style.boxShadow = "var(--zer0-shadow-focus)"; };
  const onBlur = (e) => { e.currentTarget.style.boxShadow = "none"; };

  const ic = icon ? <i className={`bi bi-${icon}`} aria-hidden="true" /> : null;
  const content = (
    <>
      {iconPosition === "start" && ic}
      {children}
      {iconPosition === "end" && ic}
    </>
  );

  const handlers = { onMouseEnter: onEnter, onMouseLeave: onLeave, onFocus, onBlur };

  if (href && !disabled) {
    return (
      <a href={href} style={base} onClick={onClick} {...handlers} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button type={type} style={base} disabled={disabled} onClick={onClick} {...handlers} {...rest}>
      {content}
    </button>
  );
}
