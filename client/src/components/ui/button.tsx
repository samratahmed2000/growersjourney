import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Button styles live in one exported function.
 *
 * Contrast note: accent-600 (#128653) is the darkest accent that still reads as
 * green and passes WCAG AA with white text. Brand-900 is used for the primary
 * action. No button uses accent-500 (#16A36A) as a background with white text,
 * because that combination fails AA for normal text.
 */
export type ButtonVariant = "primary" | "accent" | "secondary" | "inverse";
export type ButtonSize = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-60";

const SIZES: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-900 text-white hover:bg-brand-800",
  accent: "bg-accent-600 text-white hover:bg-brand-900",
  secondary:
    "border border-line bg-surface text-ink hover:border-brand-900/25 hover:bg-canvas",
  inverse:
    "border border-white/25 bg-white/5 text-white hover:border-white/40 hover:bg-white/10",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(BASE, SIZES[size], VARIANTS[variant], className);
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}
