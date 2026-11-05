export const QUESTION_TYPES = ['정상', '모호', '문서에 없음', '정책 함정'] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export type QuestionSource = 'AI 초안' | '직접 업로드'

/** approved 승인 · pending 미검토 · deleted 삭제(복원 가능) */
export type QuestionStatus = 'approved' | 'pending' | 'deleted'

export type Question = {
  id: string
  text: string
  type: QuestionType
  source: QuestionSource
  /** 연결된 근거 청크. 직접 업로드는 라벨이 없을 수 있음 */
  chunk: string | null
  expected: string
  status: QuestionStatus
}

export type DraftCounts = Record<QuestionType, number>
