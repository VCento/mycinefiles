import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/AppShell";
import { getDuels } from "@/server/actions/duels";
import { ProgressSteps } from "@/components/create/ProgressSteps";
import { CreateDuelsClient } from "@/app/create/duels/CreateDuelsClient";
import { copy } from "@/lib/copy/es";

// Session-gated and DB-backed — never statically cache.
export const dynamic = "force-dynamic";

export default async function CreateDuelsPage() {
  const user = await requireUser();

  // Lazily ensures the draft profile exists and returns any saved answers.
  const result = await getDuels();

  return (
    <AppShell username={user.username}>
      <div className="mb-8">
        <ProgressSteps current={1} />
      </div>

      {result.ok ? (
        <CreateDuelsClient initialAnswers={result.data} />
      ) : (
        // A failed read must never render as "unanswered" — saved answers may
        // exist. The plain <a> forces a full reload, bypassing the Router Cache.
        <p className="text-sm text-red-400" role="alert">
          {copy.create.duels.loadError}{" "}
          <a
            href="/create/duels"
            className="font-medium underline underline-offset-2 hover:text-red-300"
          >
            {copy.create.duels.retry}
          </a>
        </p>
      )}
    </AppShell>
  );
}
