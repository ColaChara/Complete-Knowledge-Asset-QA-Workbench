"use client";

import type { KnowledgeAsset } from "@/types/knowledge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, truncate } from "@/lib/utils";
import { PencilIcon, Trash2Icon } from "lucide-react";

interface AssetCardProps {
  asset: KnowledgeAsset;
  isSelected?: boolean;
  onClick?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "刚刚";

  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`;
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AssetCard({
  asset,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: AssetCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "group cursor-pointer transition-colors hover:bg-muted/50",
        isSelected && "ring-1 ring-ring"
      )}
      onClick={() => onClick?.(asset.id)}
    >
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">{asset.title}</CardTitle>
        <span className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(asset.createdAt)}
          </span>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(asset.id);
              }}
            >
              <PencilIcon className="size-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`确定删除「${asset.title}」？`)) {
                  onDelete(asset.id);
                }
              }}
            >
              <Trash2Icon className="size-3" />
            </Button>
          )}
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {truncate(asset.content, 120)}
        </p>
        <div className="flex flex-wrap gap-1">
          {asset.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
