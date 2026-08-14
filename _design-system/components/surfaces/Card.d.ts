import * as React from "react";

export interface CardProps {
  children?: React.ReactNode;
  /** Enable the hover lift (translateY -2px, deeper shadow). @default false */
  hover?: boolean;
  /** @default "1.25rem" */
  padding?: string;
  style?: React.CSSProperties;
}

/**
 * The dominant zer0-mistakes surface: borderless, soft small shadow, .75rem
 * radius on a white/elevated surface. Optional hover lift.
 */
export function Card(props: CardProps): JSX.Element;
