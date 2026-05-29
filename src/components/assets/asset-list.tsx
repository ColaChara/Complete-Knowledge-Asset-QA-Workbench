"use client";

import type { KnowledgeAsset } from "@/types/knowledge";
import { AssetCard } from "@/components/assets/asset-card";

interface AssetListProps {
  assets: KnowledgeAsset[];
  selectedAssetId?: string;
  onSelectAsset?: (id: string) => void;
  onEditAsset?: (id: string) => void;
  onDeleteAsset?: (id: string) => void;
}

export function AssetList({
  assets,
  selectedAssetId,
  onSelectAsset,
  onEditAsset,
  onDeleteAsset,
}: AssetListProps) {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          暂无知识资产
        </p>
        <p className="text-xs text-muted-foreground/60">
          创建第一条资产以开始使用
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          isSelected={asset.id === selectedAssetId}
          onClick={onSelectAsset}
          onEdit={onEditAsset}
          onDelete={onDeleteAsset}
        />
      ))}
    </div>
  );
}
