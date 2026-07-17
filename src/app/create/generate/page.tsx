import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/AppShell";
import { getGenerationStatus } from "@/server/actions/profile";
import { ProgressSteps } from "@/components/create/ProgressSteps";
import { GenerateClient } from "@/app/create/generate/GenerateClient";
import { copy } from "@/lib/copy/es";

// Session-gated and DB-backed — never statically cache.
export const dynamic = "force-dynamic";

export default async function CreateGeneratePage() {
  const user = await requireUser();

  // Lazily ensures the profile exists and returns material counts + guard.
  const result = await getGenerationStatus();

  return (
    <AppShell username={user.username}>
      <div className="mb-8">
        <ProgressSteps current={3} />
      </div>

      {result.ok ? (
        <GenerateClient status={result.data} />
      ) : (
        <p className="text-sm text-red-400" role="alert">
          {copy.errors.generic}
        </p>
      )}
    </AppShell>
  );
}
