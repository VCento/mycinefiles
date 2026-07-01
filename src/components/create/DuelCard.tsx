import type { DuelKey } from "@/lib/titles/constants";
import { copy } from "@/lib/copy/es";

interface DuelCardProps {
  duelKey: DuelKey;
  options: readonly [string, string];
  /** The currently selected option value, or null if unanswered. */
  selected: string | null;
  isSaving: boolean;
  onSelect: (option: string) => void;
}

/**
 * One A/B duel: a prompt and two large, touch-friendly choice buttons. The
 * chosen side highlights. Copy (prompt + option labels) comes from `copy`.
 */
export function DuelCard({
  duelKey,
  options,
  selected,
  isSaving,
  onSelect,
}: DuelCardProps) {
  const item = copy.create.duels.items[duelKey];
  const prompt = item?.prompt ?? duelKey;

  return (
    <div
      role="radiogroup"
      aria-label={prompt}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
    >
      <p className="text-sm font-medium text-white/80">{prompt}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((option) => {
          const isOn = selected === option;
          const label = item?.options[option] ?? option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isOn}
              disabled={isSaving}
              onClick={() => onSelect(option)}
              className={[
                "min-h-14 rounded-xl px-3 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                "disabled:opacity-60",
                isOn
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                  : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
