import type { RepeatMode, RepeatTarget } from "@/lib/analogion";

export type Recording = {
  id: string;
  videoId: string;
  url: string;
  title: string;
};

export type SavedSet = {
  id: string;
  name: string;
  recordings: Recording[];
  repeatMode: RepeatMode;
  repeatTarget: RepeatTarget;
  updatedAt: string;
};

export type StoredState = {
  version: 1;
  queue: Recording[];
  sets: SavedSet[];
  preferences: {
    repeatMode: RepeatMode;
    repeatTarget: RepeatTarget;
  };
};

export function isStoredState(value: unknown): value is StoredState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<StoredState>;
  return state.version === 1 && Array.isArray(state.queue) && Array.isArray(state.sets) &&
    !!state.preferences && ["one", "three", "infinite"].includes(state.preferences.repeatMode) &&
    ["current", "queue"].includes(state.preferences.repeatTarget);
}
