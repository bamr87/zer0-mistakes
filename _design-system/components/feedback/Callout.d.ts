import * as React from "react";

export interface CalloutProps {
  children?: React.ReactNode;
  /** Semantic tone. @default "note" */
  tone?: "note" | "tip" | "warning" | "danger";
  /** Heading; defaults to the tone label (Note/Tip/Warning/Danger). */
  title?: string;
  /** Override the leading Bootstrap Icon (without `bi-` prefix). */
  icon?: string;
  style?: React.CSSProperties;
}

/**
 * Bootstrap-alert / Obsidian-callout notice with a tinted background and a
 * left accent border. Maps to the `> [!note]` callouts in zer0-mistakes docs.
 */
export function Callout(props: CalloutProps): JSX.Element;
