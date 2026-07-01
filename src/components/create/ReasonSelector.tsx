import { REASON_TAGS, type ReasonTag } from "@/lib/titles/constants";
import { copy } from "@/lib/copy/es";

interface ReasonSelectorProps {
  values: ReasonTag[];
  onToggle: (reason: ReasonTag) => void;
}

/**
 * Multi-select reason chips. Shown for positive reactions; the parent hides it
 * for rejections (reasons are optional there).
 */
export function ReasonSelector({ values, onToggle }: ReasonSelectorProps) {
  const selected = new Set(values);

  return (
    <div>
      <p className="text-sm font-medium text-white/80">
        {copy.create.reasons.prompt}
      </p>
      <p className="mt-0.5 text-xs text-white/45">
        {copy.create.reasons.optionalNote}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {REASON_TAGS.map((reason) => {
          const isOn = selected.has(reason);
          return (
            <button
              key={reason}
              type="button"
              aria-pressed={isOn}
              onClick={() => onToggle(reason)}
              className={[
                "min-h-9 rounded-full px-3 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                isOn
                  ? "bg-cine-gold/20 text-cine-gold ring-1 ring-cine-gold/40"
                  : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10",
              ].join(" ")}
            >
              {copy.create.reasons.options[reason]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
