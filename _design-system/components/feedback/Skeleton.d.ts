import * as React from "react";

/**
 * Shimmer loading-placeholder props.
 */
export interface SkeletonProps {
  /** @default "text" */
  variant?: "text" | "title" | "button" | "avatar" | "thumbnail";
  /** CSS width override, e.g. "8rem" or "40%". */
  width?: string;
  /** CSS height override. */
  height?: string;
  /** For variant "text": number of bars (the last one is 60% wide). @default 3 */
  lines?: number;
  style?: React.CSSProperties;
}

/**
 * Token-built shimmer placeholder (elevated→muted surface sweep, 1.5s) that
 * stays visible in light and dark modes and stops under
 * prefers-reduced-motion. Marked aria-hidden — pair with a visually-hidden
 * "Loading…" live region in real UIs.
 */
export function Skeleton(props: SkeletonProps): JSX.Element;
