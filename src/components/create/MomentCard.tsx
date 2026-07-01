"use client";

import { useState, useTransition } from "react";
import { saveMomentReaction } from "@/server/actions/moments";
import { type Emotion } from "@/lib/titles/constants";
import type { MomentTitleItem } from "@/lib/titles/types";
import { copy } from "@/lib/copy/es";
import { Button } from "@/components/Button";
import { Poster } from "@/components/create/Poster";
import { EmotionPicker } from "@/components/create/EmotionPicker";

interface MomentCardProps {
  item: MomentTitleItem;
  /** Called after a successful save so the parent can update its progress. */
  onSaved?: () => void;
}

const FREE_MIN = 3;

/**
 * One positive-reaction title in the moments step. Lets the user pick a curated
 * moment OR type their own, plus one emotion, then saves. Once saved it
 * collapses to a compact summary with an "edit" affordance.
 */
export function MomentCard({ item, onSaved }: MomentCardProps) {
  const hasCurated = item.curatedMoments.length > 0;

  const [momentId, setMomentId] = useState<string | null>(item.savedMomentId);
  const [freeMode, setFreeMode] = useState<boolean>(
    item.savedFreeText != null || !hasCurated,
  );
  const [freeText, setFreeText] = useState<string>(item.savedFreeText ?? "");
  const [emotion, setEmotion] = useState<Emotion | null>(item.savedEmotion);

  const initiallySaved =
    item.savedEmotion != null &&
    (item.savedMomentId != null || (item.savedFreeText ?? "") !== "");
  const [saved, setSaved] = useState<boolean>(initiallySaved);
  const [editing, setEditing] = useState<boolean>(!initiallySaved);

  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const mediaLabel =
    copy.create.mediaType[item.mediaType] ?? item.mediaType;

  const trimmed = freeText.trim();
  const momentReady = freeMode
    ? trimmed.length >= FREE_MIN
    : momentId !== null;
  const canSave = momentReady && emotion !== null && !isSaving;

  function pickCurated(id: string) {
    setMomentId(id);
    setFreeMode(false);
  }

  function enableFreeMode() {
    setFreeMode(true);
    setMomentId(null);
  }

  function handleSave() {
    if (!emotion || !momentReady) return;
    setError(null);
    const payload = freeMode
      ? { titleId: item.titleId, freeTextMoment: trimmed, emotion }
      : { titleId: item.titleId, momentId: momentId!, emotion };

    startSaving(async () => {
      const res = await saveMomentReaction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setEditing(false);
      onSaved?.();
    });
  }

  // The human-readable summary of what's saved.
  const savedMomentLabel = freeMode
    ? trimmed
    : (item.curatedMoments.find((m) => m.id === momentId)?.label ?? "");
  const savedEmotionLabel = emotion ? copy.create.emotions[emotion] : "";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex gap-3">
        <Poster
          posterPath={item.posterPath}
          title={item.displayTitle}
          className="h-16 w-11"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="font-semibold leading-tight text-white">
            {item.displayTitle}
          </p>
          <p className="mt-0.5 text-xs text-white/45">
            {mediaLabel}
            {item.releaseYear ? ` · ${item.releaseYear}` : ""}
          </p>
        </div>
        {saved && !editing ? (
          <span className="inline-flex h-7 flex-none items-center gap-1 self-start rounded-lg bg-cine-gold/15 px-2.5 text-xs font-medium text-cine-gold">
            ✓ {copy.create.moments.saved}
          </span>
        ) : null}
      </div>

      {saved && !editing ? (
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {savedMomentLabel ? (
              <p className="text-sm text-white/80">“{savedMomentLabel}”</p>
            ) : null}
            {savedEmotionLabel ? (
              <span className="mt-1.5 inline-flex w-fit items-center rounded-lg bg-cine-gold/15 px-2 py-0.5 text-xs font-medium text-cine-gold">
                {savedEmotionLabel}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-9 flex-none rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            {copy.create.moments.edit}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {hasCurated ? (
            <div>
              <p className="text-sm font-medium text-white/80">
                {copy.create.moments.curatedPrompt}
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {item.curatedMoments.map((m) => {
                  const isOn = !freeMode && momentId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() => pickCurated(m.id)}
                      className={[
                        "rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                        isOn
                          ? "bg-violet-600/15 text-white ring-1 ring-violet-500/40"
                          : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <span className="font-medium">{m.label}</span>
                      {m.description ? (
                        <span className="mt-0.5 block text-xs text-white/45">
                          {m.description}
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                <button
                  type="button"
                  aria-pressed={freeMode}
                  onClick={enableFreeMode}
                  className={[
                    "rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                    freeMode
                      ? "bg-violet-600/15 text-white ring-1 ring-violet-500/40"
                      : "border border-dashed border-white/20 bg-white/[0.02] text-white/70 hover:bg-white/10",
                  ].join(" ")}
                >
                  ✎ {copy.create.moments.freeToggle}
                </button>
              </div>
            </div>
          ) : null}

          {freeMode ? (
            <div>
              <label
                htmlFor={`free-${item.titleId}`}
                className="text-sm font-medium text-white/80"
              >
                {copy.create.moments.freeLabel}
              </label>
              <textarea
                id={`free-${item.titleId}`}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onFocus={enableFreeMode}
                rows={2}
                maxLength={280}
                placeholder={copy.create.moments.freePlaceholder}
                className="mt-1.5 w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
              />
            </div>
          ) : null}

          <EmotionPicker value={emotion} onChange={setEmotion} />

          {error ? (
            <p role="alert" className="text-sm text-cine-red">
              {error}
            </p>
          ) : null}
          {!canSave && !isSaving ? (
            <p className="text-xs text-white/40">
              {copy.create.moments.pickBoth}
            </p>
          ) : null}

          <div>
            <Button type="button" onClick={handleSave} disabled={!canSave}>
              {isSaving
                ? copy.create.moments.saving
                : copy.create.moments.save}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
