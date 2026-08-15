import * as React from "react";

export interface BadgeProps {
  children?: React.ReactNode;
  /** Solid Bootstrap colors, or "subtle" for the primary-tinted card badge. @default "primary" */
  variant?: "primary" | "secondary" | "success" | "info" | "warning" | "danger" | "subtle";
  /** Fully rounded pill shape. @default false */
  pill?: boolean;
  /** Bootstrap Icon name without the `bi-` prefix. */
  icon?: string;
  style?: React.CSSProperties;
}

/**
 * Small label / status pill matching Bootstrap badges, including the
 * `bg-primary-subtle` style used on blog-post cards.
 */
export function Badge(props: BadgeProps): JSX.Element;
