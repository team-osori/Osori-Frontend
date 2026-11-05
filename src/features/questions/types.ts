import type { QuestionCategory, TestQuestion } from './testsetApi'

/** 화면에서 고르는 질문 유형 4가지. 서버 category와 1:1로 대응합니다. */
export const QUESTION_TYPES = ['정상', '모호', '문서에 없음', '정책 함정'] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export const CATEGORY_OF: Record<QuestionType, QuestionCategory> = {
  정상: 'normal',
  모호: 'ambiguous',
  '문서에 없음': 'missing_document',
  '정책 함정': 'policy_trap',
}

/** 서버 category → 화면 이름. exception · boundary는 예전 생성 방식에서만 나오는 유형 */
export const CATEGORY_LABEL: Record<QuestionCategory, string> = {
  normal: '정상',
  ambiguous: '모호',
  missing_document: '문서에 없음',
  policy_trap: '정책 함정',
  exception: '예외',
  boundary: '경계',
}

/** approved 승인 · pending 미검토 · deleted 삭제(서버에서는 반려. 되살리면 다시 미검토) */
export type QuestionStatus = 'approved' | 'pending' | 'deleted'

/** 근거로 연결할 수 있는 정책 규칙 하나 */
export type EvidenceOption = {
  /** `${policyVersionId}:${ruleKey}` */
  value: string
  /** 화면 표시 (예: "환불정책 · refund_7days") */
  label: string
  policyVersionId: string
  ruleKey: string
  /** 규칙의 근거 원문. 질문의 evidenceQuote로 보냄 */
  sourceQuote: string
}

/** 검토 화면용 질문 */
export type Question = {
  id: string
  text: string
  category: QuestionCategory
  /** 화면에 보이는 유형 이름 */
  typeLabel: string
  /** 연결된 근거 (EvidenceOption.value). 비어 있으면 근거 미연결이라 승인할 수 없음 */
  evidence: string[]
  /** 연결된 근거의 표시 이름 */
  evidenceLabels: string[]
  /** 모범 답안. 없으면 기대 행동을 보여줌 */
  expected: string
  status: QuestionStatus
  /** 서버에서 받은 원본. 수정할 때 바꾸지 않은 항목을 그대로 보내려고 둠 */
  raw: TestQuestion
}

export type DraftCounts = Record<QuestionType, number>
