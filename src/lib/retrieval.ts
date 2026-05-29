import type { KnowledgeAsset, SearchResult } from "@/types/knowledge";
import { truncate } from "@/lib/utils";

/**
 * Normalize text for comparison: lowercase and trim.
 */
function normalize(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Check if a character belongs to CJK Unified Ideographs.
 */
const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/;
function isCJK(char: string): boolean {
  return CJK_RE.test(char);
}

/**
 * Tokenize a mixed Chinese/English query into search tokens.
 *
 * Strategy:
 *   - English tokens → extract letter/digit sequences (whitespace-agnostic)
 *   - Chinese tokens → character bigrams (2-grams)
 *
 * Character bigrams are the standard lightweight approach for CJK
 * information retrieval without requiring a segmentation library.
 * They capture word-boundary information better than unigrams while
 * needing zero external dependencies.
 *
 * Query examples and their tokenized output:
 *
 *   "AIOS support"             → ["aios", "support"]
 *   "AIOS支持什么能力"          → ["aios", "支持", "持什", "什么", "么能", "能力"]
 *   "AIOS有哪些功能"           → ["aios", "有哪", "哪些", "些功", "功能"]
 *   "什么是数字资产知识库"      → ["什么", "么是", "是数", "数字", "字资", "资产", "产知", "知识", "识库"]
 *   "Agent 工作流"             → ["agent", "工作", "作流"]
 *   "平台安全"                 → ["平台", "台安", "安全"]
 */
function tokenize(text: string): string[] {
  const tokens = new Set<string>();

  // CJK character bigrams (2-grams)
  const cjkChars = [...text].filter(isCJK);
  for (let i = 0; i + 1 < cjkChars.length; i++) {
    tokens.add(cjkChars[i] + cjkChars[i + 1]);
  }

  // English word chunks (sequences of letters and digits)
  for (const word of text.match(/[a-zA-Z0-9]+/g) ?? []) {
    tokens.add(word.toLowerCase());
  }

  return [...tokens];
}

function countMatches(tokens: string[], field: string): number {
  const normalizedField = normalize(field);
  return tokens.filter((token) => normalizedField.includes(token)).length;
}

const MAX_SNIPPET_LENGTH = 150;

/**
 * Search knowledge assets by a mixed Chinese/English query.
 *
 * Scoring (unchanged):
 *   score = titleMatchCount × 5 + tagMatchCount × 3 + contentMatchCount × 1
 *
 * Returns top 3 results with score > 0, sorted by score descending.
 *
 * Usage examples (expected results with the built-in seed data):
 *
 *   // Chinese query matching CJK bigrams in title → high score
 *   search("AIOS支持什么能力", assets)
 *   // → top result: "AIOS 平台介绍" (score ≈ aios×5 + aios×1 + 支持×1)
 *
 *   // Chinese query with strong title/tag/content overlap
 *   search("什么是数字资产知识库", assets)
 *   // → top result: "数字资产知识库" (score ≈ 6 bigrams in title ×5 = 30, plus content + tags)
 *
 *   // English-only query (existing behaviour preserved)
 *   search("platform overview", assets)
 *   // → matches "platform" in tags/content
 *
 *   // No match
 *   search("不相关内容", assets)
 *   // → []
 */
export function search(query: string, assets: KnowledgeAsset[]): SearchResult[] {
  if (!query.trim()) return [];

  const tokens = tokenize(query);

  const scored = assets.map((asset) => {
    const titleMatches = countMatches(tokens, asset.title);
    const tagMatches = countMatches(tokens, asset.tags.join(" "));
    const contentMatches = countMatches(tokens, asset.content);

    const score = titleMatches * 5 + tagMatches * 3 + contentMatches * 1;

    return {
      assetId: asset.id,
      title: asset.title,
      snippet: truncate(asset.content, MAX_SNIPPET_LENGTH),
      score,
    };
  });

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
