import { copy } from "@/lib/copy/es";

interface ProgressStepsProps {
  /** Zero-based index of the current step in `copy.create.progress.steps`. */
  current: number;
}

/**
 * The creation-flow step indicator (Títulos · Duelos · Momentos · Tu Cinefile).
 * Reused across the flow pages so the current step highlights correctly. The
 * final "Tu Cinefile" step is a Sprint-3 placeholder — shown but never current.
 */
export function ProgressSteps({ current }: ProgressStepsProps) {
  const steps = copy.create.progress.steps;

  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Progreso">
      {steps.map((label, i) => {
        const isCurrent = i === current;
        const isDone = i < current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={isCurrent ? "step" : undefined}
              className={[
                "flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold",
                isCurrent
                  ? "bg-violet-600 text-white"
                  : isDone
                    ? "bg-violet-600/25 text-violet-200"
                    : "border border-white/15 text-white/40",
              ].join(" ")}
            >
              {i + 1}
            </span>
            <span
              className={[
                "text-xs",
                isCurrent
                  ? "font-semibold text-white"
                  : isDone
                    ? "text-white/60"
                    : "text-white/40",
              ].join(" ")}
            >
              {label}
            </span>
            {i < steps.length - 1 ? (
              <span aria-hidden className="h-px w-4 bg-white/15" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
