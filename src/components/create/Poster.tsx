import { copy } from "@/lib/copy/es";

interface PosterProps {
  posterPath: string | null;
  title: string;
  /** Tailwind size classes for the frame (defaults to a search-result thumb). */
  className?: string;
}

/**
 * Poster thumbnail with a clean placeholder fallback. Titles without a poster
 * (all mock titles this sprint) render a branded placeholder, never a broken
 * <img>.
 */
export function Poster({ posterPath, title, className = "" }: PosterProps) {
  const base =
    "relative flex-none overflow-hidden rounded-lg bg-white/[0.04] border border-white/10";
  const size = className || "h-20 w-14";

  if (posterPath) {
    return (
      <div className={`${base} ${size}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterPath}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${base} ${size} flex items-center justify-center bg-gradient-to-br from-violet-600/20 to-cine-red/10`}
    >
      <span aria-hidden className="text-lg opacity-70">
        🎬
      </span>
      <span className="sr-only">{copy.create.search.posterPlaceholder}</span>
    </div>
  );
}
