import Link from "next/link";
import { copy } from "@/lib/copy/es";

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Ambient accent glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cine-red/15 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 py-12">
        {/* Wordmark */}
        <header className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-white">
            {copy.brand.wordmark}
          </span>
          <span className="h-2 w-2 rounded-full bg-cine-gold" aria-hidden />
        </header>

        {/* Hero */}
        <section className="mt-16 flex-1">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Tu cine,
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-cine-gold to-cine-red bg-clip-text text-transparent">
              tu perfil.
            </span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            {copy.landing.tagline}
          </p>

          {/* How it works */}
          <div className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
              {copy.landing.howItWorksTitle}
            </h2>
            <ol className="mt-4 flex flex-col gap-4">
              {copy.landing.steps.map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-violet-500/40 bg-violet-600/10 text-sm font-bold text-violet-300">
                    {step.n}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="text-sm text-white/55">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTAs */}
        <footer className="mt-12 flex flex-col gap-3">
          <Link
            href="/register"
            className="inline-flex min-h-13 items-center justify-center rounded-xl bg-violet-600 px-6 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {copy.landing.ctaPrimary}
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {copy.landing.ctaSecondary}
          </Link>
        </footer>
      </div>
    </main>
  );
}
