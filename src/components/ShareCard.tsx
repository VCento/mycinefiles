import { copy } from "@/lib/copy/es";

interface ShareCardProps {
  displayName: string;
  archetype: string | null;
  shortSummary: string | null;
  shareQuote: string | null;
  /** 2-4 AI-coined style claims rendered as chips; [] renders nothing. */
  styleTags?: string[];
  /** Trait scores 0–100 keyed by TraitKey; the top 5 render as bars. */
  traits: Record<string, number>;
}

/** How many trait bars the card shows (of the 13). */
const TOP_TRAITS = 5;

/* -------------------------------------------------------------------------- */
/* Parametric palette — "no two cards alike" groundwork (Sprint 4A)           */
/* -------------------------------------------------------------------------- */

/**
 * Accent poles: trait families pull the accent hue toward a color world.
 * The violet pole carries a base bias so it remains the house default and
 * blending stays subtle — cards drift toward wine or gold, never hard-switch.
 */
const ACCENT_POLES = [
  {
    hue: 262, // violet — the default family
    traitKeys: ["curiosidad_intelectual", "complejidad_narrativa"],
    bias: 0.15,
  },
  {
    hue: 345, // wine/crimson — darkness tolerance
    traitKeys: ["tolerancia_oscuridad", "apertura_incomodidad"],
    bias: 0,
  },
  {
    hue: 42, // amber/gold — warmth
    traitKeys: ["calidez", "nostalgia"],
    bias: 0,
  },
] as const;

/** Weighted circular (vector) blend of hues in degrees. */
function blendHues(entries: Array<{ hue: number; weight: number }>): number {
  let x = 0;
  let y = 0;
  for (const { hue, weight } of entries) {
    const rad = (hue * Math.PI) / 180;
    x += weight * Math.cos(rad);
    y += weight * Math.sin(rad);
  }
  if (x === 0 && y === 0) return 262;
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((deg + 360) % 360);
}

interface CardAccent {
  glow: string;
  kicker: string;
  bar: string;
  quoteMark: string;
  topText: string;
  topBar: string;
  chipBorder: string;
  chipText: string;
}

/**
 * Derives the card accent DETERMINISTICALLY from the trait scores (pure math,
 * no randomness): same traits → same palette. All text tints keep lightness
 * ≥74% on the near-black base, preserving ≥4.5:1 contrast at every hue; bars
 * and glows are non-text. Empty traits (legacy/draft) → the violet default.
 */
function deriveAccent(traits: Record<string, number>): CardAccent {
  const poleEntries = ACCENT_POLES.map((pole) => {
    const scores = pole.traitKeys.map((k) =>
      Number.isFinite(traits[k]) ? Math.max(0, Math.min(100, traits[k]!)) : 0,
    );
    const avg = scores.reduce((a, b) => a + b, 0) / pole.traitKeys.length;
    const weight = pole.bias + avg / 100;
    // Squared so the DOMINANT family wins the blend: without this, the far
    // apart violet↔gold poles average through rose and a warm profile would
    // read as crimson. Still a blend — mixed profiles drift, never snap.
    return { hue: pole.hue, weight: weight * weight };
  });

  const hue = blendHues(poleEntries);
  // The #1-trait highlight leans gold but adapts toward the derived accent.
  const topHue = blendHues([
    { hue: 42, weight: 0.65 },
    { hue, weight: 0.35 },
  ]);

  return {
    glow: `radial-gradient(closest-side, hsla(${hue},70%,55%,0.22), transparent)`,
    kicker: `hsla(${hue},60%,76%,0.85)`,
    bar: `linear-gradient(90deg, hsl(${hue},65%,58%), hsla(${hue},70%,72%,0.85))`,
    quoteMark: `hsla(${hue},70%,62%,0.22)`,
    topText: `hsl(${topHue},85%,76%)`,
    topBar: `linear-gradient(90deg, hsl(${topHue},85%,68%), hsl(${topHue},80%,78%))`,
    chipBorder: `hsla(${hue},60%,70%,0.28)`,
    chipText: `hsla(${hue},45%,84%,0.92)`,
  };
}

/**
 * The shareable Cinefile card: wordmark, name, archetype, short summary,
 * style-claim chips, top trait bars and the share quote. Dark premium
 * editorial — A24 poster / film-critic scorecard, mobile-first. Accent tints
 * derive from the profile's dominant traits (see deriveAccent).
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
  styleTags = [],
  traits,
}: ShareCardProps) {
  const topTraits = Object.entries(traits)
    .filter(([, score]) => Number.isFinite(score))
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_TRAITS);

  const accent = deriveAccent(traits);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(165deg,#160f24_0%,#0a0810_45%,#070609_100%)] p-7 shadow-2xl shadow-black/60 sm:p-9">
      {/* Ambient glow, decorative only */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[140%] -translate-x-1/2"
        style={{ backgroundImage: accent.glow }}
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
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: accent.kicker }}
        >
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

      {/* Style claims — the card's conversation starters */}
      {styleTags.length > 0 ? (
        <ul className="relative mt-5 flex flex-wrap gap-2">
          {styleTags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ borderColor: accent.chipBorder, color: accent.chipText }}
            >
              {tag}
            </li>
          ))}
        </ul>
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
                        isTop ? "" : "text-white/50"
                      }`}
                      style={isTop ? { color: accent.topText } : undefined}
                    >
                      {copy.cinefile.traitLabels[key] ?? key}
                    </span>
                    <span
                      className={`font-mono text-[13px] font-bold tabular-nums ${
                        isTop ? "" : "text-white/70"
                      }`}
                      style={isTop ? { color: accent.topText } : undefined}
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
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundImage: isTop ? accent.topBar : accent.bar,
                      }}
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
            className="pointer-events-none absolute -top-2 left-0 font-[ui-serif,Georgia,serif] text-6xl leading-none"
            style={{ color: accent.quoteMark }}
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
