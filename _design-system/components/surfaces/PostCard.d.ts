import * as React from "react";

/**
 * Blog post preview card props.
 *
 * @startingPoint section="Content" subtitle="Blog preview card — image, badges, category, meta row" viewport="380x420"
 */
export interface PostCardProps {
  title?: React.ReactNode;
  /** Clamped to two lines. */
  excerpt?: React.ReactNode;
  /** Rendered as a subtle (primary-tinted) badge above the title. */
  category?: string;
  /** Display string, e.g. "Aug 14, 2026". Shown with bi-calendar3. */
  date?: string;
  /** Display string, e.g. "4 min read". Shown with bi-clock. */
  readingTime?: string;
  /** Shown with bi-person. */
  author?: string;
  /** 4:3 preview image URL; omit for the warm-to-cool gradient placeholder. */
  image?: string;
  imageAlt?: string;
  /** Red bi-lightning-fill corner badge (top-left). @default false */
  breaking?: boolean;
  /** Gold bi-star-fill corner badge (top-right). @default false */
  featured?: boolean;
  /** Makes the whole card a link. */
  href?: string;
  style?: React.CSSProperties;
}

/**
 * The theme's dominant content surface: borderless soft-shadow card with a 4:3
 * preview area, corner status badges, category badge, two-line excerpt, and an
 * icon meta row. Lifts translateY(-2px) to shadow-md on hover.
 */
export function PostCard(props: PostCardProps): JSX.Element;
