import { REACTIONS, type Reaction } from "@/lib/titles/constants";
import { copy } from "@/lib/copy/es";

interface ReactionSelectorProps {
  value: Reaction | null;
  onChange: (reaction: Reaction) => void;
}

/**
 * Single-choice reaction picker. Implemented as a radiogroup of toggle buttons
 * with large, touch-friendly targets.
 */
export function ReactionSelector({ value, onChange }: ReactionSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-white/80">
        {copy.create.reactions.prompt}
      </p>
      <div
        role="radiogroup"
        aria-label={copy.create.reactions.prompt}
        className="mt-2 flex flex-wrap gap-2"
      >
        {REACTIONS.map((reaction) => {
          const selected = value === reaction;
          return (
            <button
              key={reaction}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(reaction)}
              className={[
                "min-h-10 rounded-xl px-3.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                selected
                  ? "bg-violet-600 text-white"
                  : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10",
              ].join(" ")}
            >
              {copy.create.reactions.options[reaction]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
