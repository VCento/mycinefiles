import { TRAIT_KEYS } from "@/lib/ai/types";

/**
 * Sprint 4B — compatibility engine. PURE CODE, deliberately no AI call
 * (economy decision is closed): same inputs → same score, always.
 *
 * SAFE for both client and server (no secrets, no server-only imports),
 * though today only the /compare server page uses it.
 */

/** The public-safe material the engine compares. Never more than this. */
export interface CompareProfileInput {
  /** Trait scores 0–100 keyed by TraitKey (may be sparse for legacy rows). */
  traits: Record<string, number>;
  /** AI-coined style claims from the card. */
  styleTags: string[];
  /** Display names of positively-reacted titles. */
  positiveTitles: string[];
}

/** One trait dimension with both scores, for the closest/farthest sections. */
export interface TraitPair {
  key: string;
  a: number;
  b: number;
  diff: number;
}

export interface CompatibilityResult {
  /** 0–100, deterministic. */
  score: number;
  /** Top 3 dims where the two are CLOSEST (smallest diff first). */
  closest: TraitPair[];
  /** Top 3 dims where the two are FARTHEST (largest diff first). */
  farthest: TraitPair[];
  /** Positive titles both share (A's display casing, alphabetical). */
  sharedTitles: string[];
  /** Style tags both share, case-insensitively (A's casing, alphabetical). */
  sharedTags: string[];
}

/**
 * Blend weights: traits dominate; shared titles and tags are bonuses that
 * nudge, never dominate.
 */
const WEIGHT_TRAITS = 0.7;
const WEIGHT_TITLES = 0.2;
const WEIGHT_TAGS = 0.1;

/** Each shared positive title is worth this much of the title component. */
const POINTS_PER_SHARED_TITLE = 25;
/** Each shared style tag is worth this much of the tag component. */
const POINTS_PER_SHARED_TAG = 50;

/** How many dims each of the closest/farthest sections shows. */
const DETAIL_DIMS = 3;

/** Clamp to a valid 0–100 trait score. */
function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Normalize a name for fuzzy (case/space-insensitive) matching. */
function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Values from A that also appear in B under normalization. Keeps A's display
 * casing, dedupes, and sorts alphabetically so the output is deterministic
 * regardless of DB row order.
 */
function sharedByName(a: string[], b: string[]): string[] {
  const bSet = new Set(b.map(normalizeName));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of a) {
    const norm = normalizeName(value);
    if (!norm || !bSet.has(norm) || seen.has(norm)) continue;
    seen.add(norm);
    out.push(value.trim());
  }
  return out.sort((x, y) => x.localeCompare(y, "es"));
}

/**
 * Trait-vector closeness as 100 − RMS(per-dim diffs) over the dims BOTH
 * profiles have. Diffs are 0–100, so this lands naturally in 0–100. No
 * common dims (legacy/empty traits) → neutral 50, never a crash.
 */
function traitCloseness(pairs: TraitPair[]): number {
  if (pairs.length === 0) return 50;
  const sumSquares = pairs.reduce((acc, p) => acc + p.diff * p.diff, 0);
  return 100 - Math.sqrt(sumSquares / pairs.length);
}

/**
 * THE comparison. Deterministic pure math — a weighted blend of trait
 * closeness (dominant), a shared-positive-titles bonus, and a shared-style-tag
 * affinity bonus. Order matters only for display casing (A's wins), never for
 * the score: compute(a, b).score === compute(b, a).score.
 */
export function computeCompatibility(
  a: CompareProfileInput,
  b: CompareProfileInput,
): CompatibilityResult {
  // Per-dim pairs over the canonical 13, skipping dims missing on either side.
  const pairs: TraitPair[] = [];
  for (const key of TRAIT_KEYS) {
    const rawA = a.traits[key];
    const rawB = b.traits[key];
    if (!Number.isFinite(rawA) || !Number.isFinite(rawB)) continue;
    const scoreA = clampScore(rawA!);
    const scoreB = clampScore(rawB!);
    pairs.push({ key, a: scoreA, b: scoreB, diff: Math.abs(scoreA - scoreB) });
  }

  const sharedTitles = sharedByName(a.positiveTitles, b.positiveTitles);
  const sharedTags = sharedByName(a.styleTags, b.styleTags);

  const traitsComponent = traitCloseness(pairs);
  const titlesComponent = Math.min(
    100,
    sharedTitles.length * POINTS_PER_SHARED_TITLE,
  );
  const tagsComponent = Math.min(100, sharedTags.length * POINTS_PER_SHARED_TAG);

  const score = Math.round(
    WEIGHT_TRAITS * traitsComponent +
      WEIGHT_TITLES * titlesComponent +
      WEIGHT_TAGS * tagsComponent,
  );

  // Stable sorts: ties break on canonical TRAIT_KEYS order (pairs are built
  // in that order and Array.prototype.sort is stable), so same inputs always
  // render the same sections.
  const byDiffAsc = [...pairs].sort((x, y) => x.diff - y.diff);
  const byDiffDesc = [...pairs].sort((x, y) => y.diff - x.diff);

  return {
    score: clampScore(score),
    closest: byDiffAsc.slice(0, DETAIL_DIMS),
    farthest: byDiffDesc.slice(0, DETAIL_DIMS),
    sharedTitles,
    sharedTags,
  };
}

/**
 * Picks the verdict tier for a score from tiers sorted by DESCENDING `min`
 * (the last tier must have min 0 so every score lands somewhere).
 */
export function pickVerdictTier<T extends { min: number }>(
  score: number,
  tiers: readonly T[],
): T {
  return tiers.find((tier) => score >= tier.min) ?? tiers[tiers.length - 1]!;
}
