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
