import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/AppShell";
import { copy } from "@/lib/copy/es";

// Always evaluate the session on request — never statically cache.
export const dynamic = "force-dynamic";

export default async function CreateIntroPage() {
  const user = await requireUser();
  const steps = copy.create.progress.steps;

  return (
    <AppShell username={user.username}>
      {/* Progress indicator — step 1 of the flow (only step 1 ships in 2A). */}
      <ol className="flex items-center gap-2" aria-label="Progreso">
        {steps.map((label, i) => {
          const isCurrent = i === 0;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={[
                  "flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold",
                  isCurrent
                    ? "bg-violet-600 text-white"
                    : "border border-white/15 text-white/40",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <span
                className={[
                  "text-xs",
                  isCurrent ? "font-semibold text-white" : "text-white/40",
                ].join(" ")}
              >
                {label}
              </span>
              {i < steps.length - 1 ? (
                <span aria-hidden className="h-px w-4 bg-white/15" />
              ) : null}
            </li>
          );
        })}
      </ol>

      <h1 className="mt-8 text-2xl font-bold text-white">
        {copy.create.intro.title}
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-white/65">
        {copy.create.intro.subtitle}
      </p>

      <div className="mt-8">
        <Link
          href="/create/titles"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          {copy.create.intro.cta}
        </Link>
      </div>
    </AppShell>
  );
}
