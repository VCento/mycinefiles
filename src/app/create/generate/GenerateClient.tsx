"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateProfile } from "@/server/actions/profile";
import type { GenerationStatus } from "@/server/actions/profile";
import { copy } from "@/lib/copy/es";
import { Button } from "@/components/Button";

interface GenerateClientProps {
  status: GenerationStatus;
}

/** How long each ritual message stays on screen. */
const RITUAL_INTERVAL_MS = 2200;

/**
 * The final step: material summary, the Generar button, and the fun loading
 * ritual (rotating messages) while the AI thinks. On success → /me.
 */
export function GenerateClient({ status }: GenerateClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ritualIndex, setRitualIndex] = useState(0);

  const isRegeneration = status.profileStatus === "ready";
  const ritual = copy.create.generate.ritual;

  // Rotate the ritual messages only while generating.
  useEffect(() => {
    if (!isPending) return;
    const id = setInterval(
      () => setRitualIndex((i) => (i + 1) % ritual.length),
      RITUAL_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [isPending, ritual.length]);

  function handleGenerate() {
    setError(null);
    setRitualIndex(0);
    startTransition(async () => {
      const result = await generateProfile();
      if (result.ok) {
        router.push("/me");
        return;
      }
      setError(result.error);
    });
  }

  const totalTitles = status.positives + status.rejections;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {copy.create.generate.title}
        </h1>
        <p className="mt-2 max-w-md text-base leading-relaxed text-white/65">
          {copy.create.generate.subtitle}
        </p>
      </div>

      {/* Material summary */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm font-semibold text-white/85">
          {copy.create.generate.summary(
            totalTitles,
            status.duelsAnswered,
            status.momentsMarked,
          )}
        </p>
        {isRegeneration ? (
          <p className="mt-2 text-xs text-white/45">
            {copy.create.generate.regenerateNote}
          </p>
        ) : null}
      </div>

      {!status.canGenerate ? (
        /* Guard: friendly, tells them exactly what's missing. */
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5">
          <p className="text-sm font-semibold text-white">
            {copy.create.generate.guardTitle}
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-white/60">
            {status.positives < 3 ? (
              <li>{copy.create.generate.guardPositives}</li>
            ) : null}
            {status.rejections < 1 ? (
              <li>{copy.create.generate.guardRejections}</li>
            ) : null}
          </ul>
          <div className="mt-4">
            <Link
              href="/create/titles"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              {copy.create.generate.guardCta}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-stretch gap-4">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            fullWidth
          >
            {isRegeneration
              ? copy.create.generate.regenerate
              : copy.create.generate.button}
          </Button>

          {/* The loading ritual */}
          {isPending ? (
            <div
              className="flex flex-col items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-950/20 p-6 text-center"
              role="status"
              aria-live="polite"
            >
              <span
                aria-hidden
                className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400"
              />
              <p className="text-sm font-medium text-violet-200/90">
                {ritual[ritualIndex]}
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}

      <div>
        <Link
          href="/create/moments"
          className="text-sm font-medium text-white/50 transition-colors hover:text-white/80"
        >
          ← {copy.create.nav.back}
        </Link>
      </div>
    </div>
  );
}
