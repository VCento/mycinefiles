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
      </div>
    </AppShell>
  );
}
