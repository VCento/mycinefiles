"use client";

import { useEffect, useState, useTransition } from "react";
import {
  searchTitles,
  saveTitleReaction,
  getDraftSelection,
  removeTitleReaction,
} from "@/server/actions/titles";
import {
  isPositiveReaction,
  type Reaction,
  type ReasonTag,
} from "@/lib/titles/constants";
import type { TitleSearchResult, SelectionItem } from "@/lib/titles/types";
import { copy } from "@/lib/copy/es";
import { Button } from "@/components/Button";
import { TitleSearch } from "@/components/create/TitleSearch";
import { TitleCard } from "@/components/create/TitleCard";
import { ReactionSelector } from "@/components/create/ReactionSelector";
import { ReasonSelector } from "@/components/create/ReasonSelector";
import { SelectionListItem } from "@/components/create/SelectionListItem";

type SearchState = "idle" | "searching" | "results" | "noresults" | "error";

const keyOf = (tmdbId: string | null, mediaType: string) =>
  `${tmdbId ?? ""}|${mediaType}`;

interface CreateTitlesClientProps {
  initialSelection: SelectionItem[];
}

export function CreateTitlesClient({
  initialSelection,
}: CreateTitlesClientProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TitleSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [lastQuery, setLastQuery] = useState("");

  const [selection, setSelection] = useState<SelectionItem[]>(initialSelection);

  // The title currently being reacted to (opens the reaction panel).
  const [active, setActive] = useState<TitleSearchResult | null>(null);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [reasonTags, setReasonTags] = useState<ReasonTag[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isMutating, startMutation] = useTransition();

  // Debounced search (~300ms). The `active` flag drops stale responses so a
  // fast typist never sees results for an older query.
  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      setSearchState("idle");
      return;
    }

    let live = true;
    setSearchState("searching");
    const handle = setTimeout(() => {
      void (async () => {
        const res = await searchTitles({ query: q });
        if (!live) return;
        if (res.ok) {
          setResults(res.data);
          setLastQuery(q);
          setSearchState(res.data.length > 0 ? "results" : "noresults");
        } else {
          setResults([]);
          setSearchState("error");
          setError(res.error);
        }
      })();
    }, 300);

    return () => {
      live = false;
      clearTimeout(handle);
    };
  }, [query]);

  const addedKeys = new Set(
    selection.map((item) => keyOf(item.tmdbId, item.mediaType)),
  );

  function openPanel(title: TitleSearchResult) {
    setActive(title);
    setReaction(null);
    setReasonTags([]);
    setError(null);
  }

  function closePanel() {
    setActive(null);
    setReaction(null);
    setReasonTags([]);
  }

  function handleReactionChange(next: Reaction) {
    setReaction(next);
    // Rejections skip reasons — clear any that were picked.
    if (!isPositiveReaction(next)) setReasonTags([]);
  }

  function toggleReason(tag: ReasonTag) {
    setReasonTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function handleSave() {
    if (!active || !reaction) return;
    setError(null);
    const payload = {
      title: active,
      reaction,
      reasonTags,
    };
    startMutation(async () => {
      const res = await saveTitleReaction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const refreshed = await getDraftSelection();
      if (refreshed.ok) setSelection(refreshed.data);
      closePanel();
    });
  }

  function handleRemove(titleId: string) {
    setError(null);
    setRemovingId(titleId);
    startMutation(async () => {
      const res = await removeTitleReaction({ titleId });
      if (res.ok) {
        const refreshed = await getDraftSelection();
        if (refreshed.ok) setSelection(refreshed.data);
      } else {
        setError(res.error);
      }
      setRemovingId(null);
    });
  }

  const showReasons = reaction !== null && isPositiveReaction(reaction);

  return (
    <div className="flex flex-col gap-8">
      {/* Search */}
      <section>
        <TitleSearch
          value={query}
          onChange={setQuery}
          isSearching={searchState === "searching"}
        />

        <div className="mt-4">
          {searchState === "idle" ? (
            <p className="text-sm text-white/40">{copy.create.search.idle}</p>
          ) : null}

          {searchState === "noresults" ? (
            <p className="text-sm text-white/55">
              {copy.create.search.noResults(lastQuery)}
            </p>
          ) : null}

          {searchState === "error" ? (
            <p className="text-sm text-cine-red">{copy.create.search.error}</p>
          ) : null}

          {searchState === "results" ? (
            <div className="flex flex-col gap-2">
              {results.map((title) => (
                <TitleCard
                  key={keyOf(title.tmdbId, title.mediaType)}
                  title={title}
                  added={addedKeys.has(keyOf(title.tmdbId, title.mediaType))}
                  onReact={() => openPanel(title)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Reaction panel for the active title */}
      {active ? (
        <section className="rounded-2xl border border-violet-500/30 bg-violet-600/[0.06] p-4">
          <h2 className="text-base font-semibold text-white">
            {copy.create.panel.heading(active.displayTitle)}
          </h2>

          <div className="mt-4 flex flex-col gap-4">
            <ReactionSelector value={reaction} onChange={handleReactionChange} />

            {showReasons ? (
              <ReasonSelector values={reasonTags} onToggle={toggleReason} />
            ) : null}

            {error ? (
              <p role="alert" className="text-sm text-cine-red">
                {error}
              </p>
            ) : null}
            {!reaction ? (
              <p className="text-xs text-white/40">
                {copy.create.panel.pickReaction}
              </p>
            ) : null}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!reaction || isMutating}
              >
                {isMutating ? copy.create.panel.saving : copy.create.panel.save}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={closePanel}
                disabled={isMutating}
              >
                {copy.create.panel.cancel}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Running selection */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-white">
            {copy.create.selection.title}
          </h2>
          {selection.length > 0 ? (
            <span className="text-sm text-white/45">
              {copy.create.selection.count(selection.length)}
            </span>
          ) : null}
        </div>

        {selection.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center text-sm text-white/55">
            {copy.create.selection.empty}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {selection.map((item) => (
              <SelectionListItem
                key={item.titleId}
                item={item}
                isRemoving={removingId === item.titleId}
                onRemove={() => handleRemove(item.titleId)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
