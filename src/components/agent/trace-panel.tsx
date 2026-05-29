"use client";

import type { AgentTrace, TraceStep } from "@/types/knowledge";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  LoaderIcon,
  SearchIcon,
  ArrowUpDownIcon,
  FileTextIcon,
  type LucideIcon,
} from "lucide-react";

interface TracePanelProps {
  trace: AgentTrace | null;
  loading: boolean;
}

type StepName = TraceStep["name"];
type StepStatus = TraceStep["status"];

interface StepConfig {
  label: string;
  icon: LucideIcon;
  description: string;
}

const stepConfig: Record<StepName, StepConfig> = {
  retrieval: {
    label: "检索",
    icon: SearchIcon,
    description: "正在检索知识资产",
  },
  ranking: {
    label: "排序",
    icon: ArrowUpDownIcon,
    description: "正在评分和排序结果",
  },
  generation: {
    label: "答案生成",
    icon: FileTextIcon,
    description: "正在根据上下文生成答案",
  },
};

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "completed":
      return <CheckIcon className="size-3.5 text-emerald-500" />;
    case "running":
      return (
        <LoaderIcon className="size-3.5 animate-spin text-muted-foreground" />
      );
    default:
      return null;
  }
}

function ResultRow({
  title,
  score,
  scoreLabel,
}: {
  title: string;
  score: number;
  scoreLabel: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1">
      <span className="text-xs text-muted-foreground">{title}</span>
      <span className="text-[10px] font-medium text-muted-foreground/60">
        {scoreLabel}: {score}
      </span>
    </div>
  );
}

function StepResults({ step }: { step: TraceStep }) {
  if (step.name === "retrieval" && step.data?.results && step.data.results.length > 0) {
    return (
      <div className="mt-2 space-y-1 pl-5">
        {step.data.results.map((r) => (
          <ResultRow
            key={r.assetId}
            title={r.title}
            score={r.score}
            scoreLabel="得分"
          />
        ))}
      </div>
    );
  }

  if (step.name === "ranking" && step.data?.scores) {
    const entries = Object.entries(step.data.scores);
    if (entries.length === 0) return null;

    return (
      <div className="mt-2 space-y-1 pl-5">
        {entries.map(([title, score]) => (
          <ResultRow
            key={title}
            title={title}
            score={score}
            scoreLabel="分数"
          />
        ))}
      </div>
    );
  }

  if (step.name === "generation" && step.data?.answer) {
    return (
      <div className="mt-2 pl-5">
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {step.data.answer}
        </p>
      </div>
    );
  }

  return null;
}

export function TracePanel({ trace, loading }: TracePanelProps) {
  if (!trace && !loading) return null;

  const steps: TraceStep[] = trace?.steps ?? [
    { name: "retrieval", status: "pending" },
    { name: "ranking", status: "pending" },
    { name: "generation", status: "pending" },
  ];

  return (
    <div className="space-y-2 border-t pt-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Agent 追踪
      </h4>
      <div className="space-y-1">
        {steps.map((step) => {
          const config = stepConfig[step.name];
          const Icon = config.icon;
          const isActive = step.status === "running";
          const isDone = step.status === "completed";

          return (
            <div
              key={step.name}
              className={cn(
                "rounded-lg px-3 py-2 transition-colors",
                isActive && "bg-muted/50",
                isDone && "bg-muted/20"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full",
                    isDone && "bg-emerald-500/10",
                    isActive && "bg-muted"
                  )}
                >
                  {isDone || isActive ? (
                    <StatusIcon status={step.status} />
                  ) : (
                    <Icon className="size-3.5 text-muted-foreground/40" />
                  )}
                </span>
                <div className="flex-1">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      (isDone || isActive) && "text-foreground",
                      !isDone && !isActive && "text-muted-foreground/50"
                    )}
                  >
                    {config.label}
                  </span>
                  {isActive && (
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      {config.description}...
                    </span>
                  )}
                </div>
              </div>
              <StepResults step={step} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
