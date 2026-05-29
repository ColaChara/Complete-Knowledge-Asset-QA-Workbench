"use client";

import { useAssets } from "@/hooks/use-assets";
import { useAgent } from "@/hooks/use-agent";
import { AssetList } from "@/components/assets/asset-list";
import { AssetForm } from "@/components/assets/asset-form";
import { AgentChat } from "@/components/agent/agent-chat";
import { AnswerPanel } from "@/components/agent/answer-panel";
import { CitationList } from "@/components/agent/citation-list";
import { TracePanel } from "@/components/agent/trace-panel";
import { useState } from "react";

export default function Home() {
  const { assets, addAsset, updateAsset, deleteAsset } = useAssets();
  const { chat, ask } = useAgent();
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();
  const [editingAssetId, setEditingAssetId] = useState<string | undefined>();

  const editingAsset = editingAssetId
    ? assets.find((a) => a.id === editingAssetId) ?? null
    : null;

  return (
    <div className="flex h-dvh flex-col font-sans antialiased">
      {/* Header */}
      <header className="flex shrink-0 items-center border-b px-4 py-2">
        <h1 className="text-sm font-semibold">知识资产智能问答工作台</h1>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Knowledge Assets */}
        <aside className="flex h-full w-[360px] shrink-0 flex-col border-r">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              知识资产
            </h2>
            <AssetForm
              key={editingAssetId ?? "create"}
              onAddAsset={addAsset}
              editingAsset={editingAsset}
              onUpdateAsset={updateAsset}
              onEditDone={() => setEditingAssetId(undefined)}
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
            <AssetList
              assets={assets}
              selectedAssetId={selectedAssetId}
              onSelectAsset={setSelectedAssetId}
              onEditAsset={setEditingAssetId}
              onDeleteAsset={deleteAsset}
            />
          </div>
        </aside>

        {/* Right Panel — Agent Workspace */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center border-b px-4 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Agent 工作区
            </h2>
          </div>

          <div className="flex flex-1 flex-col gap-0 overflow-y-auto">
            <div className="flex-1 space-y-4 px-4 pb-4">
              <AnswerPanel
                answer={chat.answer}
                loading={chat.loading}
                hasQuestion={chat.question.length > 0}
              />

              {chat.answer && chat.answer.citations.length > 0 && (
                <CitationList
                  citations={chat.answer.citations}
                  onSelectAsset={setSelectedAssetId}
                />
              )}

              {chat.trace && (
                <TracePanel trace={chat.trace} loading={chat.loading} />
              )}
            </div>

            <div className="sticky bottom-0 border-t bg-background px-4 py-3">
              <AgentChat
                onAsk={(question) => ask(question, assets)}
                disabled={chat.loading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
