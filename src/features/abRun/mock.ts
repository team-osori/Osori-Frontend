import type { DiffLine } from '../../components/ui'
import type { RunRow } from './types'

/** 백엔드 연동 전 화면 확인용 초기값 (Figma 05 A/B 실행 기준) */
export const MOCK_VERSION_OPTIONS = [
  { value: 'v1', label: 'v1 · 초기 프롬프트' },
  { value: 'v2', label: 'v2 · 정책 우선' },
]

export const MOCK_TOTAL = 67
export const MOCK_V2_DONE = 41
/** 동시에 답변을 받는 문항 수 */
export const MOCK_CONCURRENCY = 2

export const MOCK_RUN_ROWS: RunRow[] = [
  { id: 'r1', question: '주문 취소는 어디서 하나요?', order: 1 },
  { id: 'r2', question: '사용한 화장품도 환불되나요?', order: 2 },
  { id: 'r3', question: '해외 배송 상품도 교환되나요?', order: 42 },
  { id: 'r4', question: '그거 언제 와요?', order: 43 },
  { id: 'r5', question: '적립금은 언제 소멸되나요?', order: 50 },
  { id: 'r6', question: '교환 배송비는 누가 내나요?', order: 51 },
]

/** 완료된 문항의 응답 시간(초) */
export const latencyOf = (order: number) => [1.1, 1.4][order - 1] ?? 1 + ((order * 7) % 9) / 10

export const MOCK_DIFF: DiffLine[] = [
  { number: 3, text: '당신은 모아몰 고객센터 상담원입니다.', type: 'same' },
  { number: 4, text: '고객의 요청은 항상 들어주세요.', type: 'same' },
  { number: 5, text: '존댓말을 사용하세요.', type: 'same' },
  { number: 6, text: '답변은 한 문장으로 짧게 하세요.', type: 'same' },
  { number: 7, text: '검색된 문서 내용만 근거로 답하세요.', type: 'same' },
  { number: 9, text: '환불은 환불정책 문서를 따릅니다.', type: 'added' },
  { number: 10, text: '배송은 배송안내 문서를 따릅니다.', type: 'added' },
]

export const MOCK_DIFF_MEMO = '정책 문서 우선 지시 추가'
