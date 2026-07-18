"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extractCompareSlug } from "@/lib/compare/slug";
import { copy } from "@/lib/copy/es";

interface CompareEntryProps {
  /** The owner's own public slug — the left side of every comparison. */
  mySlug: string;
}

/**
 * The "Comparar" entry on /me: paste a friend's card URL (or bare slug) and
 * jump to /compare/<mine>/<theirs>. Pure client navigation — no server action
 * and no DB writes; the compare page itself does the validated public read.
 */
export function CompareEntry({ mySlug }: CompareEntryProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug = extractCompareSlug(value);
    if (!slug) {
      setError(copy.compare.entry.invalid);
      return;
    }
    setError(null);
    router.push(`/compare/${mySlug}/${slug}`);
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">
        {copy.compare.entry.title}
      </h2>
      <p className="mt-1 text-xs text-white/40">{copy.compare.entry.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          placeholder={copy.compare.entry.placeholder}
          aria-label={copy.compare.entry.placeholder}
          aria-invalid={error !== null}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 flex-none items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          {copy.compare.entry.submit}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-rose-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
