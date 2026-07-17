import { copy } from "@/lib/copy/es";

interface ShareCardProps {
  displayName: string;
  archetype: string | null;
  shortSummary: string | null;
  shareQuote: string | null;
  /** Trait scores 0–100 keyed by TraitKey; the top 5 render as bars. */
  traits: Record<string, number>;
}

/** How many trait bars the card shows (of the 13). */
const TOP_TRAITS = 5;

/**
 * The shareable Cinefile card: wordmark, name, archetype, short summary, top
 * trait bars and the share quote. Dark premium, mobile-first.
 *
 * DELIBERATELY self-contained (its own gradient background, no external
 * layout assumptions) so it renders identically on /me and the public
 * /p/[slug] — and so Claude Design can elevate it in isolation later. Server
 * component: no interactivity here (copy-link lives outside the card).
 */
export function ShareCard({
  displayName,
  archetype,
  shortSummary,
  shareQuote,
  traits,
}: ShareCardProps) {
  const topTraits = Object.entries(traits)
    .filter(([, score]) => Number.isFinite(score))
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_TRAITS);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-violet-950/80 via-neutral-950 to-neutral-950 p-6 shadow-2xl shadow-violet-950/30 sm:p-8">
      {/* Header: wordmark + owner */}
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-violet-300/80">
          {copy.cinefile.cardWordmark}
        </span>
        <span className="truncate text-sm font-medium text-white/60">
          {displayName}
        </span>
      </div>

      {/* Archetype */}
      <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
        {archetype ?? "…"}
      </h2>

      {shortSummary ? (
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/70">
          {shortSummary}
        </p>
      ) : null}

      {/* Top trait bars */}
      {topTraits.length > 0 ? (
        <div className="mt-6 flex flex-col gap-2.5">
          {topTraits.map(([key, score]) => {
            const pct = Math.max(0, Math.min(100, Math.round(score)));
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
                    {copy.cinefile.traitLabels[key] ?? key}
                  </span>
                  <span className="text-[11px] font-bold tabular-nums text-violet-300">
                    {pct}
                  </span>
                </div>
                <div
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  aria-label={copy.cinefile.traitLabels[key] ?? key}
                  className="h-1.5 overflow-hidden rounded-full bg-white/10"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Share quote */}
      {shareQuote ? (
        <blockquote className="mt-6 border-l-2 border-violet-400/60 pl-4 text-base font-medium italic leading-snug text-white/85">
          «{shareQuote}»
        </blockquote>
      ) : null}

      <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-white/30">
        {copy.cinefile.cardTagline}
      </p>
    </div>
  );
}
