import type { RepeatMode, RepeatTarget } from "@/lib/analogion";

export type CuratedRecording = {
  videoId: string;
  title: string;
};

export type CuratedSet = {
  version: 1;
  id: string;
  name: string;
  description?: string;
  repeatMode: RepeatMode;
  repeatTarget: RepeatTarget;
  recordings: CuratedRecording[];
};

type CuratedDraftInput = {
  id: string;
  name: string;
  description?: string;
  repeatMode: RepeatMode;
  repeatTarget: RepeatTarget;
  recordings: CuratedRecording[];
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const modules = import.meta.glob("../catalog/sets/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

export function isCuratedSet(value: unknown): value is CuratedSet {
  if (!value || typeof value !== "object") return false;
  const set = value as Partial<CuratedSet>;
  if (set.version !== 1 || typeof set.id !== "string" || !SLUG_PATTERN.test(set.id)) return false;
  if (typeof set.name !== "string" || !set.name.trim()) return false;
  if (set.description !== undefined && typeof set.description !== "string") return false;
  if (!["one", "three", "infinite"].includes(set.repeatMode ?? "")) return false;
  if (!["current", "queue"].includes(set.repeatTarget ?? "")) return false;
  if (!Array.isArray(set.recordings) || !set.recordings.length) return false;
  return set.recordings.every((recording) =>
    !!recording && typeof recording === "object" &&
    typeof recording.videoId === "string" && VIDEO_ID_PATTERN.test(recording.videoId) &&
    typeof recording.title === "string" && !!recording.title.trim(),
  );
}

export const curatedSets: CuratedSet[] = Object.entries(modules)
  .flatMap(([path, value]) => {
    if (isCuratedSet(value)) return [value];
    console.warn(`[Analogion] Ignoring invalid curated set: ${path}`);
    return [];
  })
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

export function slugifyCuratedId(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "conjunto";
}

export function createCuratedDraft(input: CuratedDraftInput): CuratedSet {
  return {
    version: 1,
    id: slugifyCuratedId(input.id),
    name: input.name.trim(),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    repeatMode: input.repeatMode,
    repeatTarget: input.repeatTarget,
    recordings: input.recordings.map((recording) => ({
      videoId: recording.videoId,
      title: recording.title.trim(),
    })),
  };
}
