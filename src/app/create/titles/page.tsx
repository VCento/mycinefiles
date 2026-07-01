import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/AppShell";
import { getDraftSelection } from "@/server/actions/titles";
import { ProgressSteps } from "@/components/create/ProgressSteps";
import { copy } from "@/lib/copy/es";
import { CreateTitlesClient } from "@/app/create/titles/CreateTitlesClient";

// Session-gated and DB-backed — never statically cache.
export const dynamic = "force-dynamic";

export default async function CreateTitlesPage() {
  const user = await requireUser();

  // Reading the draft selection lazily creates the draft profile "on demand".
  const selection = await getDraftSelection();
  const initialSelection = selection.ok ? selection.data : [];

  return (
    <AppShell username={user.username}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/create"
          className="text-sm font-medium text-white/50 transition-colors hover:text-white/80"
        >
          ← {copy.create.intro.back}
        </Link>
        <ProgressSteps current={0} />
      </div>

      <CreateTitlesClient initialSelection={initialSelection} />

      <div className="mt-8 flex justify-end">
        <Link
          href="/create/duels"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          {copy.create.nav.toDuels} →
        </Link>
      </div>
    </AppShell>
  );
}
