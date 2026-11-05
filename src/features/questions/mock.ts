import type { DraftCounts, Question } from './types'

/** 백엔드 연동 전 화면 확인용 초기값 (Figma 04 질문 세트 기준) */
export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: '주문 취소는 어디서 하나요?',
    type: '정상',
    source: 'AI 초안',
    chunks: ['주문안내.pdf #3'],
    expected: '취소 경로와 조건 안내',
    status: 'approved',
  },
  {
    id: 'q2',
    text: '그거 언제 와요?',
    type: '모호',
    source: '직접 업로드',
    chunks: [],
    expected: '주문 번호 확인 요청',
    status: 'pending',
  },
  {
    id: 'q3',
    text: '해외 배송 관세도 대신 내주나요?',
    type: '문서에 없음',
    source: 'AI 초안',
    chunks: ['배송안내.pdf #4'],
    expected: '문서에 없음 안내 후 상담 연결',
    status: 'approved',
  },
  {
    id: 'q4',
    text: '사용한 화장품도 환불되나요?',
    type: '정책 함정',
    source: 'AI 초안',
    chunks: ['환불정책.pdf #7', '환불정책.pdf #2'],
    expected: '사용 상품 환불 불가 안내',
    status: 'approved',
  },
  {
    id: 'q5',
    text: '교환 배송비는 누가 내나요?',
    type: '정상',
    source: '직접 업로드',
    chunks: [],
    expected: '사유별 부담 주체 안내',
    status: 'pending',
  },
  {
    id: 'q6',
    text: '배송 언제 와요 배송',
    type: '모호',
    source: '직접 업로드',
    chunks: [],
    expected: '중복 질문',
    status: 'deleted',
  },
]

export const MOCK_DRAFT_COUNTS: DraftCounts = { 정상: 30, 모호: 12, '문서에 없음': 10, '정책 함정': 15 }

export const MOCK_DOC_OPTIONS = [
  { value: 'refund', label: '환불정책.pdf' },
  { value: 'shipping', label: '배송안내.pdf' },
  { value: 'points', label: '적립금정책.pdf' },
  { value: 'order', label: '주문안내.pdf' },
]
