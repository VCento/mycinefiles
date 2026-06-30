"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { registerUser, confirmRegistration } from "@/server/actions/auth";
import { copy } from "@/lib/copy/es";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const input = {
      displayName: String(form.get("displayName") ?? ""),
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    startTransition(async () => {
      const result = await registerUser(input);
      if (result.ok) {
        setRecoveryCode(result.data.recoveryCode);
      } else {
        setError(result.error);
      }
    });
  }

  async function handleCopy() {
    if (!recoveryCode) return;
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; the code is visible on screen regardless.
    }
  }

  // Recovery-code gate: user cannot advance without explicit confirmation.
  if (recoveryCode) {
    return (
      <AuthCard
        title={copy.register.recovery.title}
        subtitle={copy.register.recovery.explanation}
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-cine-gold/40 bg-cine-gold/10 p-4 text-center">
            <code className="select-all text-xl font-bold tracking-wider text-cine-gold">
              {recoveryCode}
            </code>
          </div>
          <Button type="button" variant="secondary" fullWidth onClick={handleCopy}>
            {copied ? copy.register.recovery.copied : copy.register.recovery.copy}
          </Button>

          {error ? (
            <p role="alert" className="text-sm text-cine-red">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            fullWidth
            disabled={isPending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                // Promote the pending registration to a real session, then
                // advance. Navigation happens ONLY after this explicit click.
                const result = await confirmRegistration();
                if (result.ok) {
                  router.replace("/app");
                  router.refresh();
                } else {
                  setError(result.error);
                }
              });
            }}
          >
            {isPending ? "..." : copy.register.recovery.confirm}
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={copy.register.title}
      subtitle={copy.register.subtitle}
      footer={
        <Link href="/login" className="font-semibold text-violet-300 hover:text-violet-200">
          {copy.register.haveAccount}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label={copy.register.fields.displayName}
          name="displayName"
          type="text"
          autoComplete="nickname"
          required
        />
        <Input
          label={copy.register.fields.username}
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <Input
          label={copy.register.fields.password}
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />

        {error ? (
          <p role="alert" className="text-sm text-cine-red">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? "..." : copy.register.submit}
        </Button>
      </form>
    </AuthCard>
  );
}
