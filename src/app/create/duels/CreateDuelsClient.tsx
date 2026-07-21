"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { getDuels, saveDuel } from "@/server/actions/duels";
import { DUELS } from "@/lib/titles/constants";
import type { DuelAnswers } from "@/lib/titles/types";
import { copy } from "@/lib/copy/es";
import { DuelCard } from "@/components/create/DuelCard";

interface CreateDuelsClientProps {
  initialAnswers: DuelAnswers;
}

/**
 * Step 2 orchestrator. Renders the 7 fixed duels, persists each choice with an
 * optimistic update, and offers a link onward to the moments step.
 */
export function CreateDuelsClient({ initialAnswers }: CreateDuelsClientProps) {
  const [answers, setAnswers] = useState<DuelAnswers>(initialAnswers);
  // Only show a loading state when we have nothing to render meanwhile.
  const [hydrating, setHydrating] = useState(
    () => Object.keys(initialAnswers).length === 0,
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startSaving] = useTransition();

  // Keys the user tapped this session — rehydration must never clobber them.
  const tappedKeysRef = useRef<Set<string>>(new Set());
  // Last server truth for duel answers; saveDuel rollbacks prefer this over
  // the possibly-stale `initialAnswers` snapshot.
  const serverAnswersRef = useRef<DuelAnswers | null>(null);

  // Rehydrate from the DB on mount: on back/forward navigation Next.js's
  // client Router Cache replays the RSC payload captured on first visit, so
  // `initialAnswers` can be stale (typically {}) while the real answers sit
  // in profile_duels. The `active` cleanup flag drops the response from
  // Strict Mode's throwaway first invoke and prevents setState after unmount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getDuels();
        if (!active) return;
        if (res.ok) {
          serverAnswersRef.current = res.data;
          // Merge order: server data wins over whatever `initialAnswers`
          // seeded, EXCEPT keys tapped after mount — the fetch started before
          // any tap, so its snapshot is older than those optimistic values.
          setAnswers((prev) => {
            const merged: DuelAnswers = { ...prev, ...res.data };
            for (const key of tappedKeysRef.current) {
              const k = key as keyof DuelAnswers;
              if (prev[k] !== undefined) merged[k] = prev[k];
            }
            return merged;
          });
        } else {
          // On back-nav the page-level read is stale, so this fetch is the
          // only source of truth — surface the failure; current state may be
          // wrong. Duels stay rendered and tappable.
          console.error("[CreateDuelsClient] rehydrate failed:", res.error);
          if (hydrating) setError(copy.create.duels.loadError);
        }
      } catch (err) {
        if (active) {
          console.error("[CreateDuelsClient] rehydrate error:", err);
          if (hydrating) setError(copy.create.duels.loadError);
        }
      } finally {
        if (active) setHydrating(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on
    // mount; `hydrating` is read as its mount-time value on purpose (it means
    // "initialAnswers was empty").
  }, []);

  function handleSelect(duelKey: string, option: string) {
    const previous = answers[duelKey as keyof DuelAnswers];
    if (previous === option) return; // no-op re-tap

    // Optimistic: reflect the choice immediately, roll back on failure.
    tappedKeysRef.current.add(duelKey);
    setError(null);
    setSavingKey(duelKey);
    setAnswers((prev) => ({ ...prev, [duelKey]: option }));

    startSaving(async () => {
      const res = await saveDuel({ duelKey, selectedOption: option });
      if (!res.ok) {
        setError(res.error);
        // Roll back to server truth when rehydration has it; `previous` may
        // come from a stale `initialAnswers` snapshot.
        setAnswers((prev) => ({
          ...prev,
          [duelKey]:
            serverAnswersRef.current?.[duelKey as keyof DuelAnswers] ??
            previous,
        }));
      }
      setSavingKey(null);
    });
  }

  const answeredCount = DUELS.filter(
    (d) => answers[d.key] !== undefined,
  ).length;
  const allDone = answeredCount === DUELS.length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {copy.create.duels.title}
        </h1>
        <p className="mt-2 max-w-md text-base leading-relaxed text-white/65">
          {copy.create.duels.subtitle}
        </p>
        <p className="mt-3 text-sm text-white/45" aria-live="polite">
          {hydrating
            ? copy.create.duels.loading
            : copy.create.duels.progress(answeredCount, DUELS.length)}
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-cine-red">
          {error}
        </p>
      ) : null}

      {hydrating ? null : (
        <div className="flex flex-col gap-3">
          {DUELS.map((duel) => (
            <DuelCard
              key={duel.key}
              duelKey={duel.key}
              options={duel.options}
              selected={answers[duel.key] ?? null}
              isSaving={savingKey === duel.key}
              onSelect={(option) => handleSelect(duel.key, option)}
            />
          ))}
        </div>
      )}

      {allDone ? (
        <p className="text-sm text-cine-gold">{copy.create.duels.allDone}</p>
      ) : null}

      <div className="mt-2 flex items-center justify-between">
        <Link
          href="/create/titles"
          className="text-sm font-medium text-white/50 transition-colors hover:text-white/80"
        >
          ← {copy.create.nav.toTitles}
        </Link>
        <Link
          href="/create/moments"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          {copy.create.nav.toMoments} →
        </Link>
      </div>
    </div>
  );
}
