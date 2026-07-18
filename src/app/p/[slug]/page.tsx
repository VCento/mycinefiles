import Link from "next/link";
import { ShareCard } from "@/components/ShareCard";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { getPublicCinefile } from "@/server/actions/profile";
import { env } from "@/lib/env";
import { copy } from "@/lib/copy/es";

// Public but DB-backed and per-slug — never statically cache.
export const dynamic = "force-dynamic";

interface PublicProfilePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * PUBLIC share page — NO auth. Renders ONLY card-safe fields (name, archetype,
 * short summary, quote, traits) for profiles with status='ready'; the query
 * itself is field-narrowed server-side, so deep data (reactions, duels,
 * deep summary) can never leak here. Unknown/draft slugs get a friendly 404.
 */
export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { slug } = await params;
  const result = await getPublicCinefile(slug);
  const profile = result.ok ? result.data : null;

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
        {profile ? (
          <>
            <p className="mb-5 text-sm font-medium text-white/55">
              {copy.publicProfile.intro(profile.displayName)}
            </p>

            <ShareCard
              displayName={profile.displayName}
              archetype={profile.archetype}
              shortSummary={profile.shortSummary}
              shareQuote={profile.shareQuote}
              styleTags={profile.styleTags}
              traits={profile.traits}
            />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                {copy.publicProfile.cta}
              </Link>
              <CopyLinkButton
                url={`${env.NEXT_PUBLIC_APP_URL}/p/${profile.publicSlug}`}
                label={copy.publicProfile.copyLink}
                copiedLabel={copy.publicProfile.copied}
              />
            </div>
          </>
        ) : (
          /* Friendly 404-style state: unknown slug or not-yet-ready profile. */
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
            <p className="text-lg font-semibold text-white">
              {copy.publicProfile.notFound.title}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
              {copy.publicProfile.notFound.text}
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              {copy.publicProfile.notFound.cta}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
