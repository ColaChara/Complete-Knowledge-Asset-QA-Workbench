"use client";

import { useState } from "react";
import type { KnowledgeAsset } from "@/types/knowledge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";

interface AssetFormProps {
  onAddAsset: (title: string, content: string, tags: string[]) => void;
  editingAsset?: KnowledgeAsset | null;
  onUpdateAsset?: (id: string, title: string, content: string, tags: string[]) => void;
  onEditDone?: () => void;
}

export function AssetForm({
  onAddAsset,
  editingAsset,
  onUpdateAsset,
  onEditDone,
}: AssetFormProps) {
  // Initialize state from editingAsset (create mode uses empty defaults).
  // In edit mode the parent passes a unique key so this component remounts
  // when editingAsset changes, avoiding the need for a sync useEffect.
  const [title, setTitle] = useState(editingAsset?.title ?? "");
  const [content, setContent] = useState(editingAsset?.content ?? "");
  const [tagsInput, setTagsInput] = useState(editingAsset?.tags.join(", ") ?? "");
  const [open, setOpen] = useState(false);

  const isEditing = !!editingAsset;

  function handleSubmit() {
    if (!title.trim() || !content.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (isEditing && onUpdateAsset && editingAsset) {
      onUpdateAsset(editingAsset.id, title.trim(), content.trim(), tags);
      onEditDone?.();
    } else {
      onAddAsset(title.trim(), content.trim(), tags);
      resetForm();
      setOpen(false);
    }
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setTagsInput("");
  }

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  // In edit mode: dialog is externally controlled (always open)
  // In create mode: dialog is controlled internally
  const dialogOpen = isEditing ? true : open;

  function onOpenChange(next: boolean) {
    if (isEditing) {
      if (!next) onEditDone?.();
    } else {
      setOpen(next);
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
      {!isEditing && (
        <DialogTrigger render={<Button variant="default" size="sm" />}>
          <PlusIcon />
          新建资产
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑知识资产" : "创建知识资产"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              placeholder="资产标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              placeholder="资产内容..."
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tags">标签</Label>
            <Input
              id="tags"
              placeholder="逗号分隔的标签"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            取消
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {isEditing ? "保存" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
