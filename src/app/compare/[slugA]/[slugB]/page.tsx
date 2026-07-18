import Link from "next/link";
import { MiniCard } from "@/components/compare/MiniCard";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { getComparePair } from "@/server/actions/compare";
import {
  computeCompatibility,
  pickVerdictTier,
  type TraitPair,
} from "@/lib/compare/engine";
import { PUBLIC_SLUG_REGEX } from "@/lib/validation/schemas";
import { env } from "@/lib/env";
import { copy } from "@/lib/copy/es";

// Public but DB-backed and per-pair — never statically cache.
export const dynamic = "force-dynamic";

interface ComparePageProps {
  params: Promise<{ slugA: string; slugB: string }>;
}

const CTA_CLASSES =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950";

/** One row of a closest/farthest section: label + both scores + gap bar. */
function TraitRow({
  pair,
  nameA,
  nameB,
}: {
  pair: TraitPair;
  nameA: string;
  nameB: string;
}) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
        {copy.cinefile.traitLabels[pair.key] ?? pair.key}
      </p>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {[
          { name: nameA, score: pair.a },
          { name: nameB, score: pair.b },
        ].map(({ name, score }, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-24 flex-none truncate text-xs text-white/45">
              {name}
            </span>
            <div className="h-[3px] min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={`h-full rounded-full ${i === 0 ? "bg-violet-400" : "bg-amber-300/80"}`}
                style={{ width: `${Math.round(score)}%` }}
              />
            </div>
            <span className="w-8 flex-none text-right font-mono text-xs font-bold tabular-nums text-white/70">
              {Math.round(score)}
            </span>
          </div>
        ))}
      </div>
    </li>
  );
}

/**
 * PUBLIC comparison page — NO auth, same discipline as /p/[slug]. Everything
 * rendered comes from the comparison-safe query (name, archetype, style tags,
 * traits, positive-title names); the % and sections are pure deterministic
 * code (see @/lib/compare/engine) — deliberately no AI call. A/B order is
 * preserved exactly as given in the URL.
 */
export default async function ComparePage({ params }: ComparePageProps) {
  const { slugA, slugB } = await params;

  // Playful self-compare (a valid slug on both sides is a feature, not an
  // error). Invalid same-slug pairs fall through to the friendly not-found.
  const isSelfCompare =
    slugA === slugB && typeof slugA === "string" && PUBLIC_SLUG_REGEX.test(slugA);

  const result = isSelfCompare
    ? null
    : await getComparePair(slugA, slugB);
  const pair = result?.ok ? result.data : null;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link
            href="/"
            className="text-base font-bold tracking-tight text-white"
          >
            {copy.brand.wordmark}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8">
        {isSelfCompare ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
            <p className="text-4xl font-bold tabular-nums text-violet-300">
              100%
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              {copy.compare.self.title}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
              {copy.compare.self.text}
            </p>
            <Link href="/register" className={`mt-6 ${CTA_CLASSES}`}>
              {copy.compare.self.cta}
            </Link>
          </div>
        ) : pair ? (
          <CompareResult
            a={pair.a}
            b={pair.b}
            slugA={slugA}
            slugB={slugB}
          />
        ) : (
          /* Friendly 404-style state: unknown/draft/garbage slug on either side. */
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
            <p className="text-lg font-semibold text-white">
              {copy.compare.notFound.title}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
              {copy.compare.notFound.text}
            </p>
            <Link href="/register" className={`mt-6 ${CTA_CLASSES}`}>
              {copy.compare.notFound.cta}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

interface CompareResultProps {
  a: {
    displayName: string;
    archetype: string | null;
    styleTags: string[];
    traits: Record<string, number>;
    positiveTitles: string[];
  };
  b: CompareResultProps["a"];
  slugA: string;
  slugB: string;
}

/** The happy path: mini cards → big % + verdict → detail sections. */
function CompareResult({ a, b, slugA, slugB }: CompareResultProps) {
  const comparison = computeCompatibility(a, b);
  const verdict = pickVerdictTier(comparison.score, copy.compare.verdicts);
  const sharedTagSet = new Set(
    comparison.sharedTags.map((tag) => tag.trim().toLowerCase()),
  );

  return (
    <>
      <p className="mb-5 text-sm font-medium text-white/55">
        {copy.compare.intro}
      </p>

      {/* The two contenders, order preserved: A left, B right. */}
      <div className="relative grid grid-cols-2 items-stretch gap-3">
        <MiniCard
          displayName={a.displayName}
          archetype={a.archetype}
          topStyleTag={a.styleTags[0] ?? null}
        />
        <MiniCard
          displayName={b.displayName}
          archetype={b.archetype}
          topStyleTag={b.styleTags[0] ?? null}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-neutral-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60"
        >
          {copy.compare.vs}
        </span>
      </div>

      {/* The number + the verdict. */}
      <div className="mt-8 text-center">
        <p className="font-mono text-6xl font-bold tabular-nums text-white sm:text-7xl">
          {comparison.score}
          <span className="text-3xl text-violet-300 sm:text-4xl">%</span>
        </p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
          {copy.compare.scoreLabel}
        </p>
        <h2 className="mt-5 font-[ui-serif,Georgia,'Times_New_Roman',serif] text-2xl leading-tight tracking-tight text-white sm:text-3xl">
          {verdict.title}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/60">
          {verdict.text}
        </p>
      </div>

      {/* Where they're closest / farthest. */}
      {comparison.closest.length > 0 ? (
        <section className="mt-10">
          <h3 className="text-sm font-bold uppercase tracking-wide text-white/50">
            {copy.compare.sections.closest}
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {comparison.closest.map((pair) => (
              <TraitRow
                key={pair.key}
                pair={pair}
                nameA={a.displayName}
                nameB={b.displayName}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {comparison.farthest.length > 0 ? (
        <section className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-wide text-white/50">
            {copy.compare.sections.farthest}
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {comparison.farthest.map((pair) => (
              <TraitRow
                key={pair.key}
                pair={pair}
                nameA={a.displayName}
                nameB={b.displayName}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {/* Shared positive titles. */}
      <section className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-white/50">
          {copy.compare.sections.titles}
        </h3>
        {comparison.sharedTitles.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {comparison.sharedTitles.map((title) => (
              <li
                key={title}
                className="rounded-full border border-violet-500/30 bg-violet-950/30 px-3 py-1.5 text-xs font-semibold text-violet-200"
              >
                {title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm text-white/50">
            {copy.compare.titlesEmpty}
          </p>
        )}
      </section>

      {/* Style tags side by side; shared ones light up. */}
      {a.styleTags.length > 0 || b.styleTags.length > 0 ? (
        <section className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-wide text-white/50">
            {copy.compare.sections.tags}
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[a, b].map((profile, i) => (
              <div key={i} className="min-w-0">
                <p className="truncate text-xs font-medium text-white/45">
                  {profile.displayName}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {profile.styleTags.map((tag) => {
                    const isShared = sharedTagSet.has(tag.trim().toLowerCase());
                    return (
                      <li
                        key={tag}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                          isShared
                            ? "border-amber-300/40 bg-amber-950/30 text-amber-200"
                            : "border-white/15 text-white/50"
                        }`}
                      >
                        {tag}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {comparison.sharedTags.length > 0 ? (
            <p className="mt-2 text-xs text-white/40">
              {copy.compare.tagsShared}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Share this comparison / join. */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link href="/register" className={CTA_CLASSES}>
          {copy.compare.cta}
        </Link>
        <CopyLinkButton
          url={`${env.NEXT_PUBLIC_APP_URL}/compare/${slugA}/${slugB}`}
          label={copy.compare.copyLink}
          copiedLabel={copy.compare.copied}
        />
      </div>
    </>
  );
}
