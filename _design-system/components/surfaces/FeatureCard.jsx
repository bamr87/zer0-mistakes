import React from "react";
import { Card } from "./Card.jsx";

/**
 * zer0-mistakes FeatureCard — the landing feature card: centered circular
 * tinted icon chip over a title and description, with hover lift.
 */
export function FeatureCard({ icon = "stars", iconBg, title, description, style, ...rest }) {
  const chip = {
    width: "3.5rem",
    height: "3.5rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: iconBg || "rgba(var(--zer0-color-primary-rgb), 0.12)",
    color: iconBg ? "#fff" : "var(--zer0-color-primary)",
    fontSize: "1.5rem",
    marginBottom: "var(--zer0-space-3)",
  };
  return (
    <Card hover padding="1.75rem" style={{ textAlign: "center", ...style }} {...rest}>
      <span style={chip}>
        <i className={`bi bi-${icon}`} aria-hidden="true" />
      </span>
      <h3 style={{ margin: "0 0 0.4rem", fontSize: "var(--zer0-text-h5)", fontWeight: "var(--zer0-font-weight-semibold)", color: "var(--zer0-color-ink)" }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: "var(--zer0-color-ink-muted)", lineHeight: "var(--zer0-leading-normal)" }}>
        {description}
      </p>
    </Card>
  );
}
