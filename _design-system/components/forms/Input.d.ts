import * as React from "react";

export interface InputProps {
  label?: string;
  id?: string;
  /** @default "text" */
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Leading Bootstrap Icon name without the `bi-` prefix. */
  icon?: string;
  /** Helper or error text under the field. */
  help?: string;
  /** Show the danger border + red focus ring. @default false */
  invalid?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/**
 * Labelled Bootstrap 5.3 text field wired to the zer0-mistakes focus ring,
 * with optional leading icon, help text, and invalid state.
 */
export function Input(props: InputProps): JSX.Element;
