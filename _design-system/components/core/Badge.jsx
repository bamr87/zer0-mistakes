import React from "react";

/**
 * zer0-mistakes Badge — small status/label pill matching Bootstrap badges,
 * including the subtle `bg-*-subtle` variants used on blog cards.
 */
export function Badge({ children, variant = "primary", pill = false, icon, style, ...rest }) {
  const solid = {
    primary: { bg: "var(--zer0-color-primary)", fg: "#fff" },
    secondary: { bg: "var(--zer0-color-secondary)", fg: "#fff" },
    success: { bg: "var(--zer0-color-success)", fg: "#fff" },
    info: { bg: "var(--zer0-color-info)", fg: "#fff" },
    warning: { bg: "var(--zer0-color-warning)", fg: "#212529" },
    danger: { bg: "var(--zer0-color-danger)", fg: "#fff" },
  };
  const subtle = {
    bg: "rgba(var(--zer0-color-primary-rgb), 0.12)",
    fg: "var(--zer0-color-primary)",
  };
  const p = variant === "subtle" ? subtle : solid[variant] || solid.primary;

  const css = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3em",
    fontFamily: "var(--zer0-font-sans)",
    fontWeight: "var(--zer0-font-weight-semibold)",
    fontSize: "0.75rem",
    lineHeight: 1,
    padding: "0.35em 0.6em",
    color: p.fg,
    background: p.bg,
    borderRadius: pill ? "var(--zer0-radius-pill)" : "var(--zer0-radius-sm)",
    ...style,
  };
  return (
    <span style={css} {...rest}>
      {icon ? <i className={`bi bi-${icon}`} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
