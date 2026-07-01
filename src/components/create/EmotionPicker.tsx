import { EMOTIONS, type Emotion } from "@/lib/titles/constants";
import { copy } from "@/lib/copy/es";

interface EmotionPickerProps {
  value: Emotion | null;
  onChange: (emotion: Emotion) => void;
}

/**
 * Single-choice emotion picker (one emotion per moment). Rendered as a
 * radiogroup of chips, matching the ReactionSelector style.
 */
export function EmotionPicker({ value, onChange }: EmotionPickerProps) {
  return (
    <div>
      <p className="text-sm font-medium text-white/80">
        {copy.create.moments.emotionPrompt}
      </p>
      <div
        role="radiogroup"
        aria-label={copy.create.moments.emotionPrompt}
        className="mt-2 flex flex-wrap gap-2"
      >
        {EMOTIONS.map((emotion) => {
          const selected = value === emotion;
          return (
            <button
              key={emotion}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(emotion)}
              className={[
                "min-h-9 rounded-full px-3 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                selected
                  ? "bg-cine-gold/20 text-cine-gold ring-1 ring-cine-gold/40"
                  : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10",
              ].join(" ")}
            >
              {copy.create.emotions[emotion]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
