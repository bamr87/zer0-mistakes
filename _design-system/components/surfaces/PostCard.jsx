import React from "react";
import { Badge } from "../core/Badge.jsx";

/**
 * zer0-mistakes PostCard — the blog preview card used on news, section, and
 * archive pages: 4:3 preview image (warm-to-cool gradient placeholder when no
 * image is given), breaking/featured corner badges, category badge, title,
 * two-line excerpt, and an icon meta row. Borderless with a soft shadow;
 * lifts on hover like every theme card.
 */
export function PostCard({
  title,
  excerpt,
  category,
  date,
  readingTime,
  author,
  image,
  imageAlt = "",
  breaking = false,
  featured = false,
  href,
  style,
  ...rest
}) {
  const [lift, setLift] = React.useState(false);
  const card = {
    display: "block",
    maxWidth: "22rem",
    overflow: "hidden",
    background: "var(--zer0-color-bg)",
    border: 0,
    borderRadius: "var(--zer0-radius)",
    boxShadow: lift ? "var(--zer0-shadow-md)" : "var(--zer0-shadow-sm)",
    transform: lift ? "translateY(-2px)" : "none",
    color: "var(--zer0-color-ink)",
    textDecoration: "none",
    transition:
      "transform var(--zer0-motion-duration-base) var(--zer0-motion-ease-standard), box-shadow var(--zer0-motion-duration-base) var(--zer0-motion-ease-standard)",
    ...style,
  };
  const media = {
    position: "relative",
    aspectRatio: "4 / 3",
    background:
      "linear-gradient(135deg, color-mix(in srgb, var(--zer0-color-accent) 55%, #fff), color-mix(in srgb, var(--zer0-color-primary) 45%, #fff))",
  };
  const corner = (side) => ({
    position: "absolute",
    top: "0.5rem",
    [side]: "0.5rem",
  });
  const meta = {
    display: "flex",
    gap: "0.9rem",
    flexWrap: "wrap",
    alignItems: "center",
    color: "var(--zer0-color-ink-muted)",
    fontSize: "var(--zer0-text-sm)",
  };
  const Tag = href ? "a" : "article";
  return (
    <Tag
      href={href}
      style={card}
      onMouseEnter={() => setLift(true)}
      onMouseLeave={() => setLift(false)}
      {...rest}
    >
      <div style={media}>
        {image && (
          <img
            src={image}
            alt={imageAlt}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        {breaking && (
          <span style={corner("left")}>
            <Badge variant="danger" icon="lightning-fill">Breaking</Badge>
          </span>
        )}
        {featured && (
          <span style={corner("right")}>
            <Badge variant="warning" icon="star-fill">Featured</Badge>
          </span>
        )}
      </div>
      <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
        {category && (
          <div style={{ marginBottom: "0.5rem" }}>
            <Badge variant="subtle">{category}</Badge>
          </div>
        )}
        <h3
          style={{
            margin: "0 0 0.4rem",
            fontSize: "var(--zer0-text-h5)",
            fontWeight: "var(--zer0-font-weight-semibold)",
            lineHeight: "var(--zer0-leading-tight)",
          }}
        >
          {title}
        </h3>
        {excerpt && (
          <p
            style={{
              margin: "0 0 0.75rem",
              color: "var(--zer0-color-ink-muted)",
              lineHeight: "var(--zer0-leading-normal)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {excerpt}
          </p>
        )}
        <div style={meta}>
          {date && (
            <span><i className="bi bi-calendar3" aria-hidden="true" /> {date}</span>
          )}
          {readingTime && (
            <span><i className="bi bi-clock" aria-hidden="true" /> {readingTime}</span>
          )}
          {author && (
            <span><i className="bi bi-person" aria-hidden="true" /> {author}</span>
          )}
        </div>
      </div>
    </Tag>
  );
}
