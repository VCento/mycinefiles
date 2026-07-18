import { copy } from "@/lib/copy/es";

interface MiniCardProps {
  displayName: string;
  archetype: string | null;
  /** The profile's headline style claim; null renders nothing. */
  topStyleTag: string | null;
}

/**
 * Compact Cinefile card for the /compare page: name, archetype, top style
 * tag. Echoes the ShareCard's dark editorial language at postage-stamp size.
 * Server component, two of these sit side by side even at 375px.
 */
export function MiniCard({ displayName, archetype, topStyleTag }: MiniCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(165deg,#160f24_0%,#0a0810_45%,#070609_100%)] p-4 shadow-xl shadow-black/50 sm:p-5">
      <span className="block text-[8px] font-bold uppercase tracking-[0.3em] text-amber-200/60">
        {copy.cinefile.cardWordmark}
      </span>
      <p className="mt-3 truncate text-xs font-medium uppercase tracking-[0.08em] text-white/50">
        {displayName}
      </p>
      <h3 className="mt-1.5 font-[ui-serif,Georgia,'Times_New_Roman',serif] text-lg leading-snug tracking-tight text-white sm:text-xl">
        {archetype ?? "…"}
      </h3>
      {topStyleTag ? (
        <span className="mt-3 inline-block max-w-full truncate rounded-full border border-violet-400/25 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-violet-200/90">
          {topStyleTag}
        </span>
      ) : null}
    </div>
  );
}
