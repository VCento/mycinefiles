import { useId } from "react";
import { copy } from "@/lib/copy/es";

interface TitleSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Whether a search request is currently in flight (shows a hint). */
  isSearching: boolean;
}

/**
 * Search box for titles. Controlled by the parent, which debounces the value
 * (~300ms) before calling the server action.
 */
export function TitleSearch({ value, onChange, isSearching }: TitleSearchProps) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-white/80"
      >
        {copy.create.search.heading}
      </label>
      <input
        id={inputId}
        type="search"
        inputMode="search"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={copy.create.search.placeholder}
        className={[
          "min-h-12 rounded-xl bg-white/5 border border-white/15 px-4 text-base text-white",
          "placeholder:text-white/30",
          "focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40",
        ].join(" ")}
      />
      <p className="min-h-4 text-xs text-white/40" aria-live="polite">
        {isSearching ? copy.create.search.searching : ""}
      </p>
    </div>
  );
}
