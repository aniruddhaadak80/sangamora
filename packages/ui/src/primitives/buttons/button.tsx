/** Primary action button with variant, size scale and loading spinner. */
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-saffron text-ink hover:brightness-110",
  secondary: "border border-ink-10 bg-ink-muted text-paper hover:bg-ink",
  ghost: "bg-transparent text-paper hover:bg-paper/10",
  danger: "bg-vermillion text-paper hover:brightness-110",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "gap-1.5 px-2.5 py-1 text-xs",
  md: "gap-2 px-4 py-2 text-sm",
  lg: "gap-2.5 px-6 py-3 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis of the action. */
  variant?: ButtonVariant;
  /** Hit-area scale. */
  size?: ButtonSize;
  /** Renders a ring spinner and disables the button. */
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  type = "button",
  ...rest
}: ButtonProps): ReactNode {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-[background-color,filter] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
