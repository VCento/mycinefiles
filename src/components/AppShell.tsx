import type { ReactNode } from "react";
import { copy } from "@/lib/copy/es";
import { LogoutButton } from "@/app/app/LogoutButton";

interface AppShellProps {
  username: string;
  children: ReactNode;
}

/**
 * Authenticated app chrome: top bar with wordmark + logout, content slot.
 */
export function AppShell({ username, children }: AppShellProps) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <span className="text-base font-bold tracking-tight text-white">
            {copy.brand.wordmark}
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/50 sm:inline">
              @{username}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-8">{children}</main>
    </div>
  );
}
