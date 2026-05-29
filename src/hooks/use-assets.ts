"use client";

import { useState, useCallback, useEffect } from "react";
import type { KnowledgeAsset } from "@/types/knowledge";
import { getAssets, saveAsset, updateAsset as updateAssetInStorage, removeAsset, seedIfEmpty } from "@/lib/storage";

let nextCounter = Date.now();

function generateId(): string {
  nextCounter += 1;
  return `asset-${nextCounter.toString(36)}`;
}

export function useAssets() {
  const [assets, setAssets] = useState<KnowledgeAsset[]>([]);

  // Hydration-safe initialization: read from localStorage after mount.
  // Server and first client render both see [], so HTML always matches.
  // After hydration, this runs once and loads the actual data from localStorage.
  useEffect(() => {
    seedIfEmpty();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAssets(getAssets());
  }, []);

  const addAsset = useCallback(
    (title: string, content: string, tags: string[]) => {
      const asset: KnowledgeAsset = {
        id: generateId(),
        title,
        content,
        tags,
        createdAt: new Date().toISOString(),
      };
      saveAsset(asset);
      setAssets((prev) => [...prev, asset]);
    },
    []
  );

  const updateAssetCb = useCallback(
    (id: string, title: string, content: string, tags: string[]) => {
      updateAssetInStorage(id, { title, content, tags });
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, title, content, tags } : a))
      );
    },
    []
  );

  const deleteAsset = useCallback((id: string) => {
    removeAsset(id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { assets, addAsset, updateAsset: updateAssetCb, deleteAsset };
}
