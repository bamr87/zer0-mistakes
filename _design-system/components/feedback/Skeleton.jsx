import React from "react";

/**
 * zer0-mistakes Skeleton — the theme's shimmer loading placeholder
 * (_sass/components/_skeleton.scss): an elevated→muted→elevated surface
 * gradient sweeping at 1.5s, dark-mode-safe because it is built from surface
 * tokens. Honors prefers-reduced-motion.
 */
const SHIMMER_CSS = `
.zer0-skel {
  background: linear-gradient(
    90deg,
    var(--zer0-color-bg-elevated) 25%,
    var(--zer0-color-bg-muted) 50%,
    var(--zer0-color-bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: zer0-skeleton-shimmer 1.5s ease-in-out infinite;
}
@keyframes zer0-skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .zer0-skel { animation: none; }
}
`;

function Shimmer() {
  return <style>{SHIMMER_CSS}</style>;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  lines = 3,
  style,
  ...rest
}) {
  const shapes = {
    text: { height: "0.875rem", borderRadius: "var(--zer0-radius-sm)" },
    title: { height: "1.35rem", borderRadius: "var(--zer0-radius-sm)" },
    button: { width: "6.5rem", height: "2.35rem", borderRadius: "var(--zer0-radius)" },
    avatar: { width: "2.75rem", height: "2.75rem", borderRadius: "var(--zer0-radius-circle)" },
    thumbnail: { aspectRatio: "4 / 3", borderRadius: "var(--zer0-radius)" },
  };
  const base = { ...(shapes[variant] || shapes.text) };
  if (width) base.width = width;
  if (height) base.height = height;

  if (variant === "text" && lines > 1) {
    return (
      <div style={{ display: "grid", gap: "0.55rem", ...style }} {...rest} aria-hidden="true">
        <Shimmer />
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="zer0-skel"
            style={{ ...base, width: i === lines - 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
    );
  }
  return (
    <span style={{ display: "block", ...style }} {...rest} aria-hidden="true">
      <Shimmer />
      <span className="zer0-skel" style={{ display: "block", ...base }} />
    </span>
  );
}
