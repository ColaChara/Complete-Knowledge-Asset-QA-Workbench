"use client";

import type { Answer } from "@/types/knowledge";
import { Skeleton } from "@/components/ui/skeleton";

interface AnswerPanelProps {
  answer: Answer | null;
  loading: boolean;
  hasQuestion: boolean;
}

export function AnswerPanel({
  answer,
  loading,
  hasQuestion,
}: AnswerPanelProps) {
  if (!hasQuestion && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">
          输入问题以检索你的知识资产
        </p>
        <p className="text-xs text-muted-foreground/60">
          Agent 将检索相关内容并生成答案
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    );
  }

  if (!answer) return null;

  return (
    <div className="space-y-2 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        答案
      </h3>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {answer.text}
      </div>
    </div>
  );
}
