import type { UnstableItem } from './types'

/** 백엔드 연동 전 화면 확인용 (Figma 23 불안정 문항 패널 기준) */
export const MOCK_UNSTABLE_ITEMS: UnstableItem[] = [
  { id: 'u1', question: '해외 배송 상품도 교환되나요?', criterion: '근거', version: 'v3', verdicts: [true, false, true] },
  { id: 'u2', question: '적립금은 언제 소멸되나요?', criterion: '근거', version: 'v3', verdicts: [false, true, false] },
  { id: 'u3', question: '그거 언제 와요?', criterion: '응답', version: 'v3', verdicts: [true, true, false] },
  { id: 'u4', question: '쿠폰이랑 적립금 같이 써도 되나요?', criterion: '정책', version: 'v3', verdicts: [false, true, true] },
  { id: 'u5', question: '품절 상품 재입고 알림 되나요?', criterion: '응답', version: 'v3', verdicts: [true, false, false] },
]
