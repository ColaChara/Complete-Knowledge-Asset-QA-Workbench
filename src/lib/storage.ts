import type { KnowledgeAsset } from "@/types/knowledge";
import { seedAssets } from "@/data/seed";

const STORAGE_KEY = "knowledge-assets";
const SEED_VERSION_KEY = "knowledge-assets-seed-version";
const SEED_VERSION = 3;

export function getAssets(): KnowledgeAsset[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as KnowledgeAsset[];
  } catch {
    return [];
  }
}

export function saveAsset(asset: KnowledgeAsset): void {
  if (typeof window === "undefined") return;

  const assets = getAssets();
  assets.push(asset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

export function updateAsset(
  id: string,
  updates: { title?: string; content?: string; tags?: string[] }
): void {
  if (typeof window === "undefined") return;

  const assets = getAssets();
  const index = assets.findIndex((a) => a.id === id);
  if (index === -1) return;
  assets[index] = { ...assets[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

export function removeAsset(id: string): void {
  if (typeof window === "undefined") return;

  const assets = getAssets();
  const filtered = assets.filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function seedIfEmpty(): void {
  if (typeof window === "undefined") return;

  const storedVersion = localStorage.getItem(SEED_VERSION_KEY);
  if (storedVersion === String(SEED_VERSION)) return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAssets));
  localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION));
}
