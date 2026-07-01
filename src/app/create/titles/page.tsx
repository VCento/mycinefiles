import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/AppShell";
import { getDraftSelection } from "@/server/actions/titles";
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
      <div className="mb-6">
        <Link
          href="/create"
          className="text-sm font-medium text-white/50 transition-colors hover:text-white/80"
        >
          ← {copy.create.intro.back}
        </Link>
      </div>

      <CreateTitlesClient initialSelection={initialSelection} />
    </AppShell>
  );
}
