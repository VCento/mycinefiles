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
 * trait bars and the share quote. Dark premium editorial — A24 poster /
 * film-critic scorecard, mobile-first.
 *
 * DELIBERATELY self-contained (its own gradient background, no external
 * layout assumptions) so it renders identically on /me and the public
 * /p/[slug]. Server component: no interactivity here (copy-link lives
 * outside the card).
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
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(165deg,#160f24_0%,#0a0810_45%,#070609_100%)] p-7 shadow-2xl shadow-black/60 sm:p-9">
      {/* Ambient glow, decorative only */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[140%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(139,92,246,0.22),transparent)]"
      />

      {/* Header: wordmark + owner, hairline rule beneath */}
      <div className="relative flex items-baseline justify-between gap-3 border-b border-white/[0.08] pb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.34em] text-amber-200/70">
          {copy.cinefile.cardWordmark}
        </span>
        <span className="truncate text-xs font-medium uppercase tracking-[0.08em] text-white/45">
          {displayName}
        </span>
      </div>

      {/* Archetype — the title card */}
      <div className="relative mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-300/60">
          {copy.cinefile.cardTagline}
        </p>
        <h2 className="mt-2 font-[ui-serif,Georgia,'Times_New_Roman',serif] text-[2rem] leading-[1.08] tracking-tight text-white sm:text-[2.4rem]">
          {archetype ?? "…"}
        </h2>
      </div>

      {shortSummary ? (
        <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-white/60">
          {shortSummary}
        </p>
      ) : null}

      {/* Top trait bars — scorecard style */}
      {topTraits.length > 0 ? (
        <div className="relative mt-7 flex flex-col gap-3.5">
          {topTraits.map(([key, score], i) => {
            const pct = Math.max(0, Math.min(100, Math.round(score)));
            const isTop = i === 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-4 flex-none font-mono text-[11px] tabular-nums text-white/25">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span
                      className={`truncate text-[11px] font-semibold uppercase tracking-wide ${
                        isTop ? "text-amber-200/90" : "text-white/50"
                      }`}
                    >
                      {copy.cinefile.traitLabels[key] ?? key}
                    </span>
                    <span
                      className={`font-mono text-[13px] font-bold tabular-nums ${
                        isTop ? "text-amber-200" : "text-white/70"
                      }`}
                    >
                      {pct}
                    </span>
                  </div>
                  <div
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                    aria-label={copy.cinefile.traitLabels[key] ?? key}
                    className="h-[3px] overflow-hidden rounded-full bg-white/[0.08]"
                  >
                    <div
                      className={`h-full rounded-full ${
                        isTop
                          ? "bg-gradient-to-r from-amber-300 to-amber-200"
                          : "bg-gradient-to-r from-violet-500 to-violet-300/80"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Share quote — pull-quote treatment */}
      {shareQuote ? (
        <div className="relative mt-8 border-t border-white/[0.08] pt-6">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-2 left-0 font-[ui-serif,Georgia,serif] text-6xl leading-none text-violet-400/20"
          >
            “
          </span>
          <blockquote className="relative pl-6 font-[ui-serif,Georgia,'Times_New_Roman',serif] text-lg italic leading-snug text-white/85">
            {shareQuote}
          </blockquote>
        </div>
      ) : null}

      <p className="relative mt-7 text-center text-[9px] font-medium uppercase tracking-[0.3em] text-white/25">
        {copy.cinefile.cardWordmark}
      </p>
    </div>
  );
}