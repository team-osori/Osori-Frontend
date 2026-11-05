/** 프롬프트 diff 한 줄. kind로 추가/삭제/유지를 구분합니다. */
export type DiffLineKind = 'context' | 'added' | 'removed'

export type DiffLine = {
  /** 표시용 줄 번호 (삭제 줄은 이전 버전 기준) */
  number: number
  kind: DiffLineKind
  text: string
}

/** 자동 진단에서 나온 개선 제안 한 건 */
export type Suggestion = {
  id: string
  title: string
  /** 근거 요약 (예: "4번째 줄 · 정책 실패 2건") */
  rationale: string
  /** 기본 체크 여부 */
  defaultChecked: boolean
}

/** 재평가 범위 선택지 */
export type ReevaluationScope = 'all' | 'failed'

export type ImprovementPlan = {
  fromVersion: string
  toVersion: string
  /** 변경된 줄 수 (예: 2) */
  changedLines: number
  diff: DiffLine[]
  suggestions: Suggestion[]
  /** 제안으로 해결되지 않는 원인 안내 문구 */
  unresolvedNote: string
  scope: ReevaluationScope
  /** 범위별 문항 수 */
  allCount: number
  failedCount: number
  versionMemo: string
}
