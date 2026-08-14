import * as React from "react";

/**
 * Circular floating-action-button props.
 *
 * @startingPoint section="Core" subtitle="Circular FAB from the bottom-right utility stack" viewport="360x200"
 */
export interface FabProps {
  /** Bootstrap Icon name without the `bi-` prefix. @default "arrow-up" */
  icon?: string;
  /** Accessible name — required for icon-only buttons. */
  label?: string;
  /** @default "md" (3.5rem, --zer0-space-fab-size); "sm" is 2.75rem. */
  size?: "sm" | "md";
  /** @default "primary" */
  variant?: "primary" | "light";
  /** Render as an anchor pointing here instead of a <button>. */
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

export interface FabStackProps {
  children?: React.ReactNode;
  /** Pin to the viewport (theme behaviour). Set false inside demos. @default true */
  fixed?: boolean;
  style?: React.CSSProperties;
}

/**
 * Circular FAB wired to the fab-size/fab-shadow/motion tokens; lifts on hover
 * and shows the token focus ring.
 */
export function Fab(props: FabProps): JSX.Element;

/**
 * Bottom-right FAB column (column-reverse, --zer0-space-fab-gap apart) on the
 * --zer0-layer-fab-* stacking scale.
 */
export function FabStack(props: FabStackProps): JSX.Element;
