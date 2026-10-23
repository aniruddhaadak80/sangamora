/** Elevated parchment-backed content card, dark or light. */
import type { ReactNode } from "react";

export type CardTone = "dark" | "light";

export type CardPadding = "cozy" | "roomy";

const TONE_CLASSES: Record<CardTone, string> = {
  dark: "border-ink-10 bg-ink/60 text-paper",
  light: "border-ink-10 bg-paper text-ink",
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  cozy: "p-4",
  roomy: "p-6",
};

export interface CardProps {
  /** Colour scheme. */
  tone: CardTone;
  /** Inner padding scale. */
  padding: CardPadding;
  /** Card body. */
  children: ReactNode;
  /** Extra classes merged onto the card. */
  className?: string;
}

export function Card({ tone, padding, children, className = "" }: CardProps): ReactNode {
  return (
    <div className={`rounded-xl border shadow-sm ${TONE_CLASSES[tone]} ${PADDING_CLASSES[padding]} ${className}`}>
      {children}
    </div>
  );
}
