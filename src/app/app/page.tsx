import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/AppShell";
import { copy } from "@/lib/copy/es";

// Always evaluate the session on request — never statically cache.
export const dynamic = "force-dynamic";

export default async function AppDashboardPage() {
  const user = await requireUser();

  return (
    <AppShell username={user.username}>
      <h1 className="text-2xl font-bold text-white">
        {copy.app.greeting(user.username)}
      </h1>

      <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
        <p className="text-lg font-semibold text-white">
          {copy.app.emptyTitle}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
          {copy.app.emptyText}
        </p>
        <Link
          href="/create"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          {copy.app.emptyCta}
        </Link>
      </div>
    </AppShell>
  );
}
