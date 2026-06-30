import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

/**
 * Labeled input with large touch target and readable contrast.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, className = "", id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-white/80">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-describedby={hintId}
        className={[
          "min-h-12 rounded-xl bg-white/5 border border-white/15 px-4 text-base text-white",
          "placeholder:text-white/30",
          "focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40",
          className,
        ].join(" ")}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-white/50">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
