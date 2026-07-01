import type { SelectionItem } from "@/lib/titles/types";
import { copy } from "@/lib/copy/es";
import { Poster } from "@/components/create/Poster";

interface SelectionListItemProps {
  item: SelectionItem;
  isRemoving: boolean;
  onRemove: () => void;
}

/**
 * One saved entry in the running selection: poster thumb, title, the chosen
 * reaction, the reasons, and a remove control.
 */
export function SelectionListItem({
  item,
  isRemoving,
  onRemove,
}: SelectionListItemProps) {
  const mediaLabel = copy.create.mediaType[item.mediaType] ?? item.mediaType;
  const reactionLabel =
    copy.create.reactions.options[item.reaction] ?? item.reaction;

  return (
    <li className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <Poster
        posterPath={item.posterPath}
        title={item.displayTitle}
        className="h-16 w-11"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-semibold leading-tight text-white">
          {item.displayTitle}
        </p>
        <p className="mt-0.5 text-xs text-white/45">
          {mediaLabel}
          {item.releaseYear ? ` · ${item.releaseYear}` : ""}
        </p>

        <span className="mt-1.5 inline-flex w-fit items-center rounded-lg bg-violet-600/15 px-2 py-0.5 text-xs font-medium text-violet-300">
          {reactionLabel}
        </span>

        {item.reasonTags.length > 0 ? (
          <p className="mt-1 text-xs text-white/55">
            <span className="text-white/40">
              {copy.create.selection.reasonsLabel}{" "}
            </span>
            {item.reasonTags
              .map((tag) => copy.create.reasons.options[tag] ?? tag)
              .join(" · ")}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={isRemoving}
        aria-label={`${copy.create.selection.remove} ${item.displayTitle}`}
        className="h-9 flex-none self-start rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        {isRemoving ? "…" : copy.create.selection.remove}
      </button>
    </li>
  );
}
