"use client";

import { useState } from "react";
import Link from "next/link";
import type { MomentTitleItem } from "@/lib/titles/types";
import { copy } from "@/lib/copy/es";
import { MomentCard } from "@/components/create/MomentCard";

interface CreateMomentsClientProps {
  initialItems: MomentTitleItem[];
}

/**
 * Step 3 orchestrator. Shows one MomentCard per positive-reaction title, or an
 * empty state pointing back to titles when there are none yet. The final
 * "generate" control is a labeled, inert Sprint-3 placeholder.
 */
export function CreateMomentsClient({ initialItems }: CreateMomentsClientProps) {
  // Track which titles have a saved moment (idempotent across re-saves/edits).
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () =>
      new Set(
        initialItems
          .filter(
            (i) =>
              i.savedEmotion != null &&
              (i.savedMomentId != null || (i.savedFreeText ?? "") !== ""),
          )
          .map((i) => i.titleId),
      ),
  );
  const savedCount = savedIds.size;

  if (initialItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
        <h1 className="text-lg font-bold text-white">
          {copy.create.moments.empty.title}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/60">
          {copy.create.moments.empty.text}
        </p>
        <div className="mt-5">
          <Link
            href="/create/titles"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {copy.create.moments.empty.cta}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {copy.create.moments.title}
        </h1>
        <p className="mt-2 max-w-md text-base leading-relaxed text-white/65">
          {copy.create.moments.subtitle}
        </p>
        <p className="mt-3 text-sm text-white/45" aria-live="polite">
          {copy.create.duels.progress(savedCount, initialItems.length)}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {initialItems.map((item) => (
          <MomentCard
            key={item.titleId}
            item={item}
            onSaved={() =>
              setSavedIds((prev) => {
                if (prev.has(item.titleId)) return prev;
                const next = new Set(prev);
                next.add(item.titleId);
                return next;
              })
            }
          />
        ))}
      </div>

      {/* Inert Sprint-3 placeholder — labeled, does nothing this sprint. */}
      <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-xl bg-violet-600/40 px-6 text-base font-semibold text-white/70"
        >
          {copy.create.moments.generate}
        </button>
        <p className="mt-2 text-xs text-white/40">
          {copy.create.moments.generateNote}
        </p>
      </div>

      <div className="mt-1">
        <Link
          href="/create/duels"
          className="text-sm font-medium text-white/50 transition-colors hover:text-white/80"
        >
          ← {copy.create.nav.backToDuels}
        </Link>
      </div>
    </div>
  );
}
