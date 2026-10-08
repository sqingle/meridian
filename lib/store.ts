"use client";
import { useSyncExternalStore } from "react";
import type { Deal } from "./deals";

export type Dataset = { fileName: string; uploadedAt: string; deals: Deal[] };

const KEY = "meridian:dataset:v1";
const listeners = new Set<() => void>();
let cache: Dataset | null | undefined;

function read(): Dataset | null {
  if (cache !== undefined) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Dataset) : null;
  } catch {
    cache = null;
  }
  return cache;
}

function emit() {
  listeners.forEach((l) => l());
}

export function saveDataset(ds: Dataset) {
  cache = ds;
  try {
    localStorage.setItem(KEY, JSON.stringify(ds));
  } catch {
    /* storage full/blocked: keep in memory for this tab */
  }
  emit();
}

export function clearDataset() {
  cache = null;
  try {
    localStorage.removeItem(KEY);
  } catch {}
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = undefined;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** undefined = not hydrated yet, null = nothing uploaded, otherwise the dataset. */
export function useDataset(): Dataset | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}
