import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/AppShell";
import { getMomentsStep } from "@/server/actions/moments";
import { ProgressSteps } from "@/components/create/ProgressSteps";
import { CreateMomentsClient } from "@/app/create/moments/CreateMomentsClient";

// Session-gated and DB-backed — never statically cache.
export const dynamic = "force-dynamic";

export default async function CreateMomentsPage() {
  const user = await requireUser();

  // Lazily ensures the draft profile exists and returns positive titles + saved
  // moments. On failure we render the empty state rather than crash.
  const result = await getMomentsStep();
  const initialItems = result.ok ? result.data : [];

  return (
    <AppShell username={user.username}>
      <div className="mb-8">
        <ProgressSteps current={2} />
      </div>

      <CreateMomentsClient initialItems={initialItems} />
    </AppShell>
  );
}
