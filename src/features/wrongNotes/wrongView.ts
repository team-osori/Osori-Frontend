import type { EvaluationItem, EvaluationItemSummary } from '../evaluation/api'

/** 틀린 원인(가설): 프롬프트 · 검색 · 모델. 서버는 확정하지 않고 "예상"만 줍니다(confirmedCause는 항상 null). */
export type WrongCause = 'prompt' | 'search' | 'model'

export const CAUSE: Record<WrongCause, { label: string; color: string; shape: 'rounded' | 'circle' | 'bar' }> = {
  prompt: { label: '프롬프트 문제', color: 'var(--color-cause-prompt)', shape: 'rounded' },
  search: { label: '검색 문제', color: 'var(--color-cause-search)', shape: 'circle' },
  model: { label: '모델 문제', color: 'var(--color-review)', shape: 'bar' },
}

const AREA: Record<string, WrongCause> = { PROMPT: 'prompt', RETRIEVAL: 'search', MODEL: 'model' }

/** 서버의 activeHypothesisAreas(현재 오답이고 최신 검토로도 실패인 조건의 가설) 중 첫 번째를 대표 원인으로 */
export function causeOf(item: Pick<EvaluationItemSummary, 'activeHypothesisAreas'>): WrongCause | null {
  for (const area of item.activeHypothesisAreas ?? []) if (AREA[area]) return AREA[area]
  return null
}

/** 왜 틀렸나 문장 조각. mark가 있으면 형광 표시 (doc 근거 정책 원문 · prompt 프롬프트 지시) */
export type WhyPart = { text: string; mark?: 'doc' | 'prompt' }

type Issue = { reason?: string | null; recommendation?: string | null; policyEvidence?: { quote?: string } }
type Hypothesis = { area: string; reason: string }
type SideAnalysis = { issues?: Issue[]; activeHypotheses?: Hypothesis[] }

/** 상세 응답에서 답변과 "왜 틀렸나"를 만듭니다. 정책 원문은 형광 표시, 원인 가설은 이어서 붙임 */
export function whyOf(item: EvaluationItem): { answer: string; why: WhyPart[] } {
  const side = ((item.analysis as Record<string, unknown> | undefined)?.a ?? {}) as SideAnalysis
  const issue = side.issues?.[0]
  const hypothesis = side.activeHypotheses?.[0]
  const parts: WhyPart[] = []
  if (issue?.policyEvidence?.quote) {
    parts.push({ text: '정책 원문 ' }, { text: `“${issue.policyEvidence.quote}”`, mark: 'doc' }, { text: ' ' })
  }
  parts.push({ text: issue?.reason ?? issue?.recommendation ?? '조건을 충족하지 못했습니다.' })
  if (hypothesis?.reason && hypothesis.reason !== issue?.reason) parts.push({ text: ` ${hypothesis.reason}` })
  return { answer: item.a?.answer ?? '', why: parts }
}
