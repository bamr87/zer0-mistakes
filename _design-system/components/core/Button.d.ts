import * as React from "react";

/**
 * Themed Bootstrap button props.
 *
 * @startingPoint section="Core" subtitle="Themed Bootstrap button with icon + variants" viewport="700x160"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual style. @default "primary" */
  variant?: "primary" | "secondary" | "light" | "outline-primary" | "ghost";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Bootstrap Icon name without the `bi-` prefix, e.g. "rocket-takeoff". */
  icon?: string;
  /** @default "start" */
  iconPosition?: "start" | "end";
  disabled?: boolean;
  /** Render as an anchor pointing here instead of a <button>. */
  href?: string;
  /** @default "button" */
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

/**
 * Bootstrap 5.3 themed button wired to zer0-mistakes color/motion tokens.
 * Primary buttons mix toward the accent on hover; outline/ghost fill on hover.
 */
export function Button(props: ButtonProps): JSX.Element;
