import { QUESTION_TYPES, type DraftCounts, type Question } from './types'

/**
 * AI 질문 초안 생성.
 * 백엔드 API가 정해지기 전까지 자리표시 질문을 돌려줍니다. 계약이 정해지면 이 함수만 교체하면 됩니다.
 */
export async function generateDraft(docNames: string[], counts: DraftCounts): Promise<Question[]> {
  await new Promise((resolve) => setTimeout(resolve, 900))
  const stamp = Date.now()
  const docs = docNames.length ? docNames : ['정책 문서']

  return QUESTION_TYPES.flatMap((type) =>
    Array.from({ length: counts[type] }, (_, i) => {
      const doc = docs[i % docs.length]
      return {
        id: `ai-${stamp}-${type}-${i}`,
        text: `[초안] ${doc} 기반 ${type} 질문 ${i + 1}`,
        type,
        source: 'AI 초안' as const,
        chunks: [`${doc} #${i + 1}`],
        expected: '검토 후 기대 동작을 입력하세요',
        status: 'pending' as const,
      }
    }),
  )
}
