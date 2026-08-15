import * as React from "react";

/**
 * Landing-page feature card props.
 *
 * @startingPoint section="Marketing" subtitle="Icon-chip feature card from the landing page" viewport="360x260"
 */
export interface FeatureCardProps {
  /** Bootstrap Icon name without the `bi-` prefix. @default "stars" */
  icon?: string;
  /** Override the tinted chip background (e.g. a solid bg for an inverted chip). */
  iconBg?: string;
  title?: string;
  description?: string;
  style?: React.CSSProperties;
}

/**
 * The landing-page feature card: circular tinted icon chip above a title and
 * description, hover lift. Mirrors _layouts/landing.html feature cards.
 */
export function FeatureCard(props: FeatureCardProps): JSX.Element;
