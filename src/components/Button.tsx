import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40",
  secondary:
    "bg-white/5 hover:bg-white/10 text-white border border-white/15",
  ghost: "bg-transparent hover:bg-white/5 text-white/80",
};

/**
 * Accessible button with large, touch-friendly targets (min-h 48px).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", fullWidth = false, className = "", children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-xl px-5 min-h-12",
          "text-base font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          fullWidth ? "w-full" : "",
          variants[variant],
          className,
        ].join(" ")}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
