import type { TitleSearchResult } from "@/lib/titles/types";
import { copy } from "@/lib/copy/es";
import { Poster } from "@/components/create/Poster";

interface TitleCardProps {
  title: TitleSearchResult;
  added: boolean;
  onReact: () => void;
}

/**
 * One search result: poster (or placeholder), title + meta, and a CTA to react.
 * If the title is already in the running selection it shows an "added" badge.
 */
export function TitleCard({ title, added, onReact }: TitleCardProps) {
  const mediaLabel = copy.create.mediaType[title.mediaType] ?? title.mediaType;

  return (
    <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <Poster posterPath={title.posterPath} title={title.displayTitle} />

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-semibold leading-tight text-white">
          {title.displayTitle}
        </p>
        <p className="mt-0.5 text-xs text-white/45">
          {mediaLabel}
          {title.releaseYear ? ` · ${title.releaseYear}` : ""}
        </p>
        {title.overview ? (
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-white/55">
            {title.overview}
          </p>
        ) : null}

        <div className="mt-2">
          {added ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-violet-600/15 px-2.5 py-1 text-xs font-medium text-violet-300">
              ✓ {copy.create.search.added}
            </span>
          ) : (
            <button
              type="button"
              onClick={onReact}
              className="inline-flex min-h-9 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {copy.create.search.react}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
