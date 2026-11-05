/** 판정이 갈린 평가 기준 */
export type GradingCriterion = '검색' | '근거' | '응답' | '정책'

/** 같은 질문을 여러 번 돌렸을 때 판정이 달라진 문항 */
export type UnstableItem = {
  id: string
  question: string
  criterion: GradingCriterion
  version: string
  /** 반복 실행별 통과 여부 */
  verdicts: boolean[]
}

/* ---------- 06 자동 채점 결과 ---------- */

export type MetricKey = 'retrieval' | 'grounding' | 'response' | 'policy'

/** 프롬프트 버전별 점수(%) */
export type VersionScore = { version: string; score: number }

export type MetricSummary = {
  key: MetricKey
  label: string
  scores: VersionScore[]
}

/** 실패 원인 */
export type FailureCause = 'retrieval' | 'prompt' | 'model'

export type FailureBreakdown = {
  version: string
  /** 원인별 실패 건수 */
  counts: Record<FailureCause, number>
}

export type PromptVersion = {
  version: string
  title: string
  /** YYYY-MM-DD HH:mm */
  createdAt: string
}

export type GradingSummary = {
  /** 채점자 일치도(%) */
  agreement: number
  unstableCount: number
  labeledCount: number
  totalCount: number
  metrics: MetricSummary[]
  failures: FailureBreakdown[]
  versions: PromptVersion[]
  /** 사람 판정 대기열 구성 */
  queue: { total: number; split: number; unstable: number; sample: number }
}

/* ---------- 07 사람 판정 ---------- */

/** 대기열에 들어온 이유. split 채점자 의견 갈림 · unstable 반복 불안정 · sample 합의 샘플 */
export type QueueReason = 'split' | 'unstable' | 'sample'

export type JudgeStatus = 'waiting' | 'judging' | 'pass' | 'fail'

export type Chunk = { id: string; source: string; text: string }

export type GraderVerdict = { grader: string; pass: boolean; comment: string }

export type JudgeItem = {
  id: string
  question: string
  reason: QueueReason
  status: JudgeStatus
  /** 질문 위에 붙는 분류 (예: 정책 함정) */
  tags: string[]
  /** 판정 대상 버전과 그 이전 버전의 답변 */
  baseAnswer: { version: string; text: string }
  targetAnswer: { version: string; text: string }
  chunks: Chunk[]
  graders: GraderVerdict[]
}

/* ---------- 08 원인 진단 ---------- */

export type DiffKind = 'context' | 'removed' | 'added'

export type CauseDiffLine = { number: number; kind: DiffKind; text: string }

export type DiagnosisCause = {
  id: string
  cause: FailureCause
  /** 배지 문구 (예: 검색 원인 · 프롬프트 원인 · 지시 충돌) */
  label: string
  /** 실패한 평가 기준과 건수 (예: 근거 실패 · 유사 문항 4건) */
  meta: string
  question: string
  /** 답변 앞부분 (밑줄 없는 부분) */
  answerBefore?: string
  /** 문제가 된 답변 구간 */
  answerFlag: string
  answerAfter?: string
  /** 검색된 청크 안내 (검색 · 모델 원인) */
  chunk?: { title: string; text: string }
  /** 프롬프트 수정 제안 diff (프롬프트 원인) */
  diff?: CauseDiffLine[]
  /** 카드 맨 아래 안내 (검색 · 모델 원인) */
  note?: string
}
