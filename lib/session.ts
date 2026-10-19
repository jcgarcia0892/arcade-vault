// Mock session and score storage on localStorage, using the template's keys.
// Client-only: import it from "use client" components.

import { useSyncExternalStore } from "react";

export interface User {
  name: string; // uppercase, max 10 chars, "PLAYER1" when left empty
}

export interface SavedScore {
  game: string; // Game.id
  score: number;
  name: string;
  at: number; // Date.now()
}

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent) {
  if (e.key === null || e.key === USER_KEY) emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

// useSyncExternalStore needs a stable snapshot, so the parsed user is cached
// against the raw string it came from.
let cachedRaw: string | null = null;
let cachedUser: User | null = null;

function getSnapshot(): User | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedUser = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

// The prerendered HTML always shows the signed-out state.
function getServerSnapshot(): User | null {
  return null;
}

function login(user: User) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
  emit();
}

function logout() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
  emit();
}

export function useUser() {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { user, login, logout };
}

export function saveScore(entry: Omit<SavedScore, "at">) {
  try {
    const all = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]") as SavedScore[];
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {}
}
