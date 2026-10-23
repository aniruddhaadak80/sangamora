/** Square icon-only button carrying an accessible label. */
import type { MouseEvent, ReactNode } from "react";

export type IconButtonVariant = "surface" | "ghost";

export type IconButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  surface: "border border-ink-10 bg-ink text-paper hover:bg-ink-muted",
  ghost: "text-paper hover:bg-paper/10",
};

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-11 text-base",
};

export interface IconButtonProps {
  /** Accessible name for the action. */
  label: string;
  /** Graphical child, ideally a lucide icon. */
  icon: ReactNode;
  /** Visual emphasis. */
  variant: IconButtonVariant;
  /** Box scale. */
  size: IconButtonSize;
  /** Click handler. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Extra classes merged onto the button. */
  className?: string;
}

export function IconButton({ label, icon, variant, size, onClick, className = "" }: IconButtonProps): ReactNode {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid shrink-0 place-items-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {icon}
    </button>
  );
}
