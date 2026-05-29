"use client";

import type { Citation } from "@/types/knowledge";
import { BookOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CitationListProps {
  citations: Citation[];
  onSelectAsset?: (id: string) => void;
}

export function CitationList({
  citations,
  onSelectAsset,
}: CitationListProps) {
  if (citations.length === 0) return null;

  return (
    <div className="space-y-2 border-t pt-3">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <BookOpenIcon className="size-3" />
        参考来源
      </h4>
      <ul className="space-y-1">
        {citations.map((citation) => (
          <li key={citation.assetId}>
            <button
              type="button"
              onClick={() => onSelectAsset?.(citation.assetId)}
              className={cn(
                "text-left text-xs text-muted-foreground transition-colors",
                "hover:text-foreground hover:underline",
                "cursor-pointer"
              )}
            >
              {citation.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
