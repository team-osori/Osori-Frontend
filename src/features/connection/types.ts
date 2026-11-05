/** 정책 문서 카드에 보이는 문서 하나 */
export type PolicyDoc = {
  id: string
  name: string
  /** 이름 옆 작은 글씨 (예: "2026-11-06 저장", "올리는 중") */
  meta: string
}
