import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/AppShell";
import { getDuels } from "@/server/actions/duels";
import { ProgressSteps } from "@/components/create/ProgressSteps";
import { CreateDuelsClient } from "@/app/create/duels/CreateDuelsClient";

// Session-gated and DB-backed — never statically cache.
export const dynamic = "force-dynamic";

export default async function CreateDuelsPage() {
  const user = await requireUser();

  // Lazily ensures the draft profile exists and returns any saved answers.
  const result = await getDuels();
  const initialAnswers = result.ok ? result.data : {};

  return (
    <AppShell username={user.username}>
      <div className="mb-8">
        <ProgressSteps current={1} />
      </div>

      <CreateDuelsClient initialAnswers={initialAnswers} />
    </AppShell>
  );
}
