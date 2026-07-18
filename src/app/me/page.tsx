import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/AppShell";
import { ShareCard } from "@/components/ShareCard";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { CompareEntry } from "@/components/compare/CompareEntry";
import { getMyProfile, getMyRecommendations } from "@/server/actions/profile";
import { env } from "@/lib/env";
import { copy } from "@/lib/copy/es";

// Session-gated and DB-backed — never statically cache.
export const dynamic = "force-dynamic";

/**
 * The PRIVATE full profile: card + deep summary + formula + strengths +
 * blind spots + copy-link. Empty state (CTA to create) until status='ready'.
 */
export default async function MePage() {
  const user = await requireUser();
  const result = await getMyProfile();
  const profile = result.ok ? result.data : null;

  if (!profile || profile.status !== "ready") {
    return (
      <AppShell username={user.username}>
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
          <p className="text-lg font-semibold text-white">
            {copy.me.empty.title}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
            {copy.me.empty.text}
          </p>
          <Link
            href="/create"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {copy.me.empty.cta}
          </Link>
        </div>
      </AppShell>
    );
  }

  // Built server-side: env is server-only; the client only sees the final URL.
  const shareUrl = `${env.NEXT_PUBLIC_APP_URL}/p/${profile.publicSlug}`;

  // Persisted by generateProfile — read-only here, no AI call.
  const recsResult = await getMyRecommendations();
  const recommendations = recsResult.ok ? recsResult.data : [];

  return (
    <AppShell username={user.username}>
      <p className="mb-5 text-base font-semibold text-violet-300">
        {copy.me.ready}
      </p>

      <ShareCard
        displayName={profile.displayName}
        archetype={profile.archetype}
        shortSummary={profile.shortSummary}
        shareQuote={profile.shareQuote}
        styleTags={profile.styleTags}
        traits={profile.traits}
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <CopyLinkButton
          url={shareUrl}
          label={copy.me.copyLink}
          copiedLabel={copy.me.copied}
        />
        <Link
          href="/create/titles"
          className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          {copy.me.update}
        </Link>
      </div>

      {/* "Comparar" — paste a friend's card link, jump to /compare (Sprint 4B). */}
      <CompareEntry mySlug={profile.publicSlug} />

      {/* "Para ti" — persisted recommendations. PRIVATE: never on /p/[slug]. */}
      {recommendations.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">
            {copy.me.recs.title}
          </h2>
          <p className="mt-1 text-xs text-white/40">{copy.me.recs.subtitle}</p>
          <ul className="mt-4 flex flex-col gap-3">
            {recommendations.map((rec) => (
              <li
                key={rec.id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-base font-semibold text-white">
                    {rec.title}
                  </span>
                  {rec.matchScore != null ? (
                    <span className="flex-none font-mono text-xs font-bold tabular-nums text-violet-300">
                      {copy.me.recs.match(rec.matchScore)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                  {rec.reason}
                </p>
                {rec.category ? (
                  <span className="mt-3 inline-block rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
                    {rec.category}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">
            {copy.me.recs.title}
          </h2>
          <p className="mt-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm text-white/50">
            {copy.me.recs.empty}
          </p>
        </section>
      )}

      {/* Deep sections — private only, never on /p/[slug]. */}
      {profile.deepSummary ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">
            {copy.me.sections.deepSummary}
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {profile.deepSummary.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-white/75">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {profile.formula.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">
            {copy.me.sections.formula}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.formula.map((ingredient) => (
              <li
                key={ingredient}
                className="rounded-full border border-violet-500/30 bg-violet-950/30 px-3 py-1.5 text-xs font-semibold text-violet-200"
              >
                {ingredient}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.strengths.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">
            {copy.me.sections.strengths}
          </h2>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
            {profile.strengths.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-white/75">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.blindSpots.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">
            {copy.me.sections.blindSpots}
          </h2>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
            {profile.blindSpots.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-white/75">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}
