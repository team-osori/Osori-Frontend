import { api, createIdempotencyKey, pathId, type Page, type RequestExtras, type Schema } from '../../lib/api'
import { servicePath } from '../service/api'

/* 프롬프트 수정 제안 (백엔드 docs/PROMPT_IMPROVEMENT_HANDOFF.md)
 * 오답 문항들로 제안을 만들고(동기, 최대 약 1분) → 고르고(PATCH) → 새 프롬프트 버전으로 적용 → 재시험 */

export type Suggestion = Schema<'SuggestionResponse'>
export type SuggestionEdit = Schema<'SuggestionEdit'>
export type SuggestionSummary = Schema<'SuggestionSummary'>
export type SuggestionCapabilities = Schema<'SuggestionCapabilities'>
/** 제안의 근거 스냅샷 한 건. id는 수정안의 evidenceIds와 연결됨 */
export type SuggestionEvidence = { id: string; itemId: string; questionId: string }

/** 한 번에 제안을 만들 수 있는 오답 문항 수 */
export const SUGGESTION_ITEMS_MAX = 20

const base = (projectId: string, serviceId: string) => `${servicePath(projectId, serviceId)}/prompt-suggestions`
const one = (projectId: string, serviceId: string, id: string) => `${base(projectId, serviceId)}/${pathId(id, '수정 제안 ID')}`

export function getSuggestionCapabilities(projectId: string, serviceId: string, extras: RequestExtras = {}) {
  return api.get<SuggestionCapabilities>(`${base(projectId, serviceId)}/capabilities`, { signal: extras.signal })
}

/**
 * 제안 만들기. 201이어도 status가 FAILED일 수 있어 항상 status · error를 확인해야 합니다.
 * 같은 키로 다시 보내면 모델을 다시 부르지 않고 처음 결과를 돌려주므로, 다시 시도할 때는 새 키를 씁니다.
 */
export function createSuggestion(
  projectId: string,
  serviceId: string,
  input: { evaluationId: string; baseVersionId: string; itemIds: string[] },
  extras: RequestExtras = {},
) {
  return api.post<Suggestion>(base(projectId, serviceId), input, { idempotencyKey: createIdempotencyKey(), signal: extras.signal })
}

export function listSuggestions(projectId: string, serviceId: string, extras: RequestExtras & { limit?: number } = {}) {
  return api.get<Page<SuggestionSummary>>(base(projectId, serviceId), { query: { limit: extras.limit ?? 20 }, signal: extras.signal })
}

export function getSuggestion(projectId: string, serviceId: string, id: string, extras: RequestExtras = {}) {
  return api.get<Suggestion>(one(projectId, serviceId, id), { signal: extras.signal })
}

/** 고른 수정안 전체를 바꿉니다. 겹치는 수정안을 함께 고르면 409 OVERLAPPING_SUGGESTIONS */
export function selectSuggestions(
  projectId: string,
  serviceId: string,
  id: string,
  expectedRevision: number,
  selectedSuggestionIds: string[],
  extras: RequestExtras = {},
) {
  return api.patch<Suggestion>(one(projectId, serviceId, id), { expectedRevision, selectedSuggestionIds }, { signal: extras.signal })
}

/** 근거 스냅샷에서 수정안이 겨냥한 평가 문항 ID들 */
export function targetedItems(suggestion: Suggestion, edit: SuggestionEdit): string[] {
  const evidence = ((suggestion.snapshot as { evidence?: SuggestionEvidence[] }).evidence ?? [])
  const byId = new Map(evidence.map((e) => [e.id, e.itemId]))
  return [...new Set(edit.evidenceIds.map((id) => byId.get(id)).filter((v): v is string => Boolean(v)))]
}
