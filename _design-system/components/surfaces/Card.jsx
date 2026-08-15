import React from "react";

/**
 * zer0-mistakes Card — the dominant surface pattern: borderless, soft small
 * shadow, white surface. Set `hover` for the landing-card lift.
 */
export function Card({ children, hover = false, padding = "1.25rem", style, ...rest }) {
  const [lift, setLift] = React.useState(false);
  const css = {
    background: "var(--zer0-color-bg)",
    border: "1px solid var(--zer0-color-border-translucent)",
    borderRadius: "var(--zer0-radius-xl)",
    boxShadow: lift ? "var(--zer0-shadow-md)" : "var(--zer0-shadow-sm)",
    padding,
    transform: lift ? "translateY(-2px)" : "none",
    transition:
      "transform var(--zer0-motion-duration-base) var(--zer0-motion-ease-standard), box-shadow var(--zer0-motion-duration-base) var(--zer0-motion-ease-standard)",
    ...style,
  };
  const handlers = hover
    ? { onMouseEnter: () => setLift(true), onMouseLeave: () => setLift(false) }
    : {};
  return (
    <div style={css} {...handlers} {...rest}>
      {children}
    </div>
  );
}
