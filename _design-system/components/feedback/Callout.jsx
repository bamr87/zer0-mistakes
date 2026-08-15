import React from "react";

/**
 * zer0-mistakes Callout — Bootstrap-alert / Obsidian-callout style notice with
 * a leading icon and a left accent border in a semantic tone.
 */
export function Callout({ children, tone = "note", title, icon, style, ...rest }) {
  const tones = {
    note: { color: "var(--zer0-color-primary)", rgb: "var(--zer0-color-primary-rgb)", icon: "info-circle", label: "Note" },
    tip: { color: "var(--zer0-color-success)", rgb: "40, 167, 69", icon: "lightbulb", label: "Tip" },
    warning: { color: "var(--zer0-color-warning)", rgb: "255, 193, 7", icon: "exclamation-triangle", label: "Warning" },
    danger: { color: "var(--zer0-color-danger)", rgb: "220, 53, 69", icon: "x-octagon", label: "Danger" },
  };
  const t = tones[tone] || tones.note;
  const css = {
    fontFamily: "var(--zer0-font-sans)",
    color: "var(--zer0-color-ink)",
    background: `rgba(${t.rgb}, 0.08)`,
    borderLeft: `4px solid ${t.color}`,
    borderRadius: "var(--zer0-radius-lg)",
    padding: "0.85rem 1rem",
    display: "flex",
    gap: "0.7rem",
    lineHeight: "var(--zer0-leading-normal)",
    ...style,
  };
  return (
    <div style={css} {...rest}>
      <i className={`bi bi-${icon || t.icon}`} style={{ color: t.color, fontSize: "1.1rem", marginTop: "0.1rem" }} aria-hidden="true" />
      <div>
        <div style={{ fontWeight: "var(--zer0-font-weight-semibold)", color: t.color, marginBottom: "0.15rem" }}>
          {title || t.label}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
