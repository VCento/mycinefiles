import Link from "next/link";
import type { ReactNode } from "react";
import { copy } from "@/lib/copy/es";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Centered card shell used by the register and login surfaces.
 */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center text-lg font-bold tracking-tight text-white"
        >
          {copy.brand.wordmark}
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-white/60">{subtitle}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>

        {footer ? (
          <div className="mt-6 text-center text-sm text-white/60">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}
