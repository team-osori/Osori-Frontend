import type { EvaluationItem, GradingTile } from '../evaluation/api'
import { CATEGORY_LABEL } from '../questions/types'

/** 화면 판정: 사람이 내린 답변 전체 O/X. 아직 안 했으면 null */
export type Verdict = 'correct' | 'wrong'

/** 채점 칸 하나 */
export type Seat = {
  id: string
  number: number
  typeLabel: string
  verdict: Verdict | null
  /** 답변이 있어 O/X를 남길 수 있는지 (실행 중 · 호출 실패면 false) */
  canReview: boolean
  /** 서버 상태 (호출 실패 · 판정 오류 등을 표시할 때) */
  screenStatus: GradingTile['screenStatus']
  /** AI 기준 · 조건 판정만 본 결과 (사람 O/X 적용 전) */
  aiStatus: GradingTile['screenStatus']
  reviewRevision: number
}

export function toSeat(tile: GradingTile): Seat {
  const review = tile.answerReview?.verdict
  return {
    id: tile.id,
    number: tile.questionNumber,
    typeLabel: tile.category ? (CATEGORY_LABEL[tile.category as keyof typeof CATEGORY_LABEL] ?? tile.category) : '',
    verdict: review === 'pass' ? 'correct' : review === 'fail' ? 'wrong' : null,
    canReview: tile.canReview,
    screenStatus: tile.screenStatus,
    aiStatus: tile.derivedScreenStatus,
    reviewRevision: tile.reviewRevision,
  }
}

/* 상세 응답의 analysis.a는 명세상 자유 객체라서, 화면에 쓰는 항목만 타입을 적어 둡니다.
 * (백엔드 docs/EVALUATION_SCREEN_CONTRACT.md "답변·조건·정책·해설 연결") */
type Judgment = { status: string; verdict: 'pass' | 'fail' | null; reason?: string | null } | null
type ConditionRecord = {
  conditionId: string
  kind: 'required' | 'forbidden'
  requirement: string
  judgment: Judgment
  policyEvidence: { policyVersionId: string; quote: string }
}
type IssueRecord = ConditionRecord & {
  reason?: string | null
  answerQuote?: string | null
  missingGuidance?: string[]
  recommendation?: string | null
}
type SideAnalysis = { conditions?: ConditionRecord[]; issues?: IssueRecord[] }

/** 채점 기준 한 줄. met: 충족(금지 조건이면 하지 않음), null: 판정 못 함 */
export type Criterion = { id: string; text: string; met: boolean | null }

export type ItemDetail = {
  question: string
  answer: string | null
  criteria: Criterion[]
  /** 해설: 미충족 조건의 이유. ref는 근거 정책 원문 */
  explanation: { ref?: string; text: string }
}

export function toDetail(item: EvaluationItem): ItemDetail {
  const side = ((item.analysis as Record<string, unknown> | undefined)?.a ?? {}) as SideAnalysis
  const criteria = (side.conditions ?? []).map((c) => ({
    id: c.conditionId,
    text: c.kind === 'forbidden' ? `하면 안 됨: ${c.requirement}` : c.requirement,
    met: c.judgment?.verdict === 'pass' ? true : c.judgment?.verdict === 'fail' ? false : null,
  }))
  const issue = side.issues?.[0]
  return {
    question: item.question,
    answer: item.a?.answer ?? null,
    criteria,
    explanation: issue
      ? { ref: issue.policyEvidence?.quote, text: issue.reason ?? issue.recommendation ?? '조건을 충족하지 못했습니다.' }
      : { text: criteria.length > 0 && criteria.every((c) => c.met) ? '모든 채점 기준을 충족했습니다.' : '자동 판정 해설이 없습니다.' },
  }
}

/** 서버 상태를 사람이 읽을 문구로 (답변이 없어 O/X를 못 남기는 이유) */
export const STATUS_TEXT: Record<GradingTile['screenStatus'], string> = {
  CORRECT: '정답',
  INCORRECT: '오답',
  PENDING: '채점 중',
  REMAINING: '아직 안 함',
  EXECUTION_ERROR: '챗봇 호출 실패',
  JUDGMENT_ERROR: '판정 오류',
  REVIEW_REQUIRED: '검토 필요',
}
