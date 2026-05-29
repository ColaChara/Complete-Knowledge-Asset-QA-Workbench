import type { SearchResult, Answer, KnowledgeAsset } from "@/types/knowledge";

export function generateAnswer(
  question: string,
  results: SearchResult[],
  assets: KnowledgeAsset[]
): Answer {
  if (results.length === 0) {
    return {
      text: "未找到与问题相关的知识资产信息。请尝试重新表述或添加更多关键词。",
      citations: [],
    };
  }

  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const citations = results.map((r) => ({
    assetId: r.assetId,
    title: r.title,
  }));

  const sourceTitles = results.map((r) => `"${r.title}"`).join(", ");
  const contextParts: string[] = [];

  for (const result of results) {
    const asset = assetMap.get(result.assetId);
    if (asset) {
      const relevantContent = extractRelevantSentences(
        asset.content,
        question
      );
      contextParts.push(`来自「${asset.title}」：${relevantContent}`);
    }
  }

  const contextText = contextParts.join("\n\n");

  const answerText = buildSummary(question, sourceTitles, contextText);

  return {
    text: answerText,
    citations,
  };
}

function extractRelevantSentences(content: string, question: string): string {
  const questionLower = question.toLowerCase();
  const questionTokens = questionLower.split(/\s+/).filter((t) => t.length > 2);

  const sentences = content.split(/(?<=[.!?])\s+/);

  const scored = sentences.map((sentence) => {
    const sentenceLower = sentence.toLowerCase();
    const matchCount = questionTokens.filter((t) =>
      sentenceLower.includes(t)
    ).length;
    return { sentence, score: matchCount };
  });

  const relevant = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (relevant.length === 0) {
    return content.length > 200 ? content.slice(0, 200) + "..." : content;
  }

  return relevant
    .slice(0, 2)
    .map((r) => r.sentence)
    .join(" ");
}

function buildSummary(
  question: string,
  sourceTitles: string,
  contextText: string
): string {
  return (
    `根据以下知识资产的检索结果：${sourceTitles}，总结如下：\n\n` +
    `${contextText}\n\n` +
    `以上信息来源于与你的问题「${question}」最相关的知识资产。`
  );
}
