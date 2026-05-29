"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizontalIcon } from "lucide-react";

interface AgentChatProps {
  onAsk: (question: string) => void;
  disabled: boolean;
}

export function AgentChat({ onAsk, disabled }: AgentChatProps) {
  const [input, setInput] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onAsk(input.trim());
    setInput("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="relative flex-1">
        <Input
          placeholder="输入你对知识资产的问题..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          className="pr-10"
        />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={disabled || !input.trim()}
        aria-label="发送问题"
      >
        <SendHorizontalIcon />
        提问
      </Button>
    </form>
  );
}
