"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/server/actions/auth";
import { copy } from "@/lib/copy/es";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutUser();
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex min-h-9 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
    >
      {isPending ? "..." : copy.app.logout}
    </button>
  );
}
