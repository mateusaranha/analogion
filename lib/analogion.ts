export type RepeatMode = "one" | "three" | "infinite";
export type RepeatTarget = "current" | "queue";
export type PlaybackCounters = { itemPlays: number; queueCycles: number };

type AdvanceInput = {
  queueLength: number;
  currentIndex: number;
  repeatMode: RepeatMode;
  repeatTarget: RepeatTarget;
  counters: PlaybackCounters;
};

export type AdvanceAction =
  | { kind: "replay"; counters: PlaybackCounters }
  | { kind: "advance"; index: number; counters: PlaybackCounters }
  | { kind: "stop"; counters: PlaybackCounters };

export function advanceAfterEnd(input: AdvanceInput): AdvanceAction {
  const limit = input.repeatMode === "one" ? 1 : input.repeatMode === "three" ? 3 : Infinity;
  if (input.queueLength <= 0) return { kind: "stop", counters: input.counters };

  if (input.repeatTarget === "current") {
    const itemPlays = input.counters.itemPlays + 1;
    const counters = { ...input.counters, itemPlays };
    return itemPlays < limit ? { kind: "replay", counters } : { kind: "stop", counters };
  }

  if (input.currentIndex < input.queueLength - 1) {
    return { kind: "advance", index: input.currentIndex + 1, counters: input.counters };
  }

  const queueCycles = input.counters.queueCycles + 1;
  const counters = { ...input.counters, queueCycles };
  return queueCycles < limit
    ? { kind: "advance", index: 0, counters }
    : { kind: "stop", counters };
}

export function extractYouTubeId(value: string): string | null {
  const input = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return validId(url.pathname.slice(1).split("/")[0]);
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") return validId(url.searchParams.get("v"));
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) return validId(parts[1]);
    }
  } catch {
    return null;
  }
  return null;
}

function validId(value: string | null | undefined) {
  return value && /^[A-Za-z0-9_-]{11}$/.test(value) ? value : null;
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}
