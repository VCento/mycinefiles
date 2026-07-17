"use client";

import { useState, useRef, useEffect } from "react";

interface CopyLinkButtonProps {
  /** Full URL to copy — built SERVER-SIDE (env is server-only). */
  url: string;
  label: string;
  copiedLabel: string;
}

/**
 * Copies a share URL to the clipboard with a brief "copied" confirmation.
 * The URL arrives as a prop; this component never touches env.
 */
export function CopyLinkButton({ url, label, copiedLabel }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (http, old browser) — fall back to prompt-free
      // selection UX: show the copied state anyway is misleading, so bail out.
      window.prompt("Copia el enlace:", url);
      return;
    }
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      aria-live="polite"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
