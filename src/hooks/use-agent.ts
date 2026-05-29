"use client";

import { useState, useCallback } from "react";
import type {
  KnowledgeAsset,
  ChatState,
  TraceStep,
} from "@/types/knowledge";
import { search } from "@/lib/retrieval";
import { generateAnswer } from "@/lib/answer-generator";

const initialChatState: ChatState = {
  question: "",
  trace: null,
  answer: null,
  loading: false,
};

function makeStep(
  name: TraceStep["name"],
  status: TraceStep["status"],
  data?: TraceStep["data"]
): TraceStep {
  return { name, status, data };
}

function yieldToReact(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function useAgent() {
  const [chat, setChat] = useState<ChatState>(initialChatState);

  const ask = useCallback(
    async (question: string, assets: KnowledgeAsset[]) => {
      if (!question.trim()) return;

      // Phase: Initial — retrieval running, others pending
      setChat({
        question,
        trace: {
          steps: [
            makeStep("retrieval", "running", { query: question }),
            makeStep("ranking", "pending"),
            makeStep("generation", "pending"),
          ],
        },
        answer: null,
        loading: true,
      });

      await yieldToReact();

      // Step 1: Retrieval
      const results = search(question, assets);

      setChat((prev) => ({
        ...prev,
        trace: {
          steps: [
            makeStep("retrieval", "completed", { query: question, results }),
            makeStep("ranking", "running"),
            makeStep("generation", "pending"),
          ],
        },
      }));

      await yieldToReact();

      // Step 2: Ranking
      const scores: Record<string, number> = {};
      for (const r of results) {
        scores[r.title] = r.score;
      }

      setChat((prev) => ({
        ...prev,
        trace: {
          steps: [
            prev.trace!.steps[0],
            makeStep("ranking", "completed", { scores, results }),
            makeStep("generation", "running"),
          ],
        },
      }));

      await yieldToReact();

      // Step 3: Generation
      const answer = generateAnswer(question, results, assets);

      setChat({
        question,
        trace: {
          steps: [
            makeStep("retrieval", "completed", { query: question, results }),
            makeStep("ranking", "completed", { scores, results }),
            makeStep("generation", "completed", { answer: answer.text }),
          ],
        },
        answer,
        loading: false,
      });
    },
    []
  );

  const reset = useCallback(() => {
    setChat(initialChatState);
  }, []);

  return { chat, ask, reset };
}
