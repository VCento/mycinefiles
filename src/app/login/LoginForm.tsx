"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { loginUser } from "@/server/actions/auth";
import { copy } from "@/lib/copy/es";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const input = {
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    startTransition(async () => {
      const result = await loginUser(input);
      if (result.ok) {
        router.replace("/app");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <AuthCard
      title={copy.login.title}
      subtitle={copy.login.subtitle}
      footer={
        <Link href="/register" className="font-semibold text-violet-300 hover:text-violet-200">
          {copy.login.noAccount}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label={copy.login.fields.username}
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <Input
          label={copy.login.fields.password}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        {error ? (
          <p role="alert" className="text-sm text-cine-red">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? "..." : copy.login.submit}
        </Button>
      </form>
    </AuthCard>
  );
}
