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

/** 질문에 연결할 수 있는 근거 청크 (정책 문서별 청크 번호) */
export const MOCK_CHUNK_OPTIONS = [
  ...Array.from({ length: 14 }, (_, i) => `환불정책.pdf #${i + 1}`),
  ...Array.from({ length: 22 }, (_, i) => `배송안내.pdf #${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `적립금정책.pdf #${i + 1}`),
  ...Array.from({ length: 17 }, (_, i) => `주문안내.pdf #${i + 1}`),
]

/** 06 시험지 · 검토 화면 확인용: 시안처럼 대부분 승인, 일부 검토 필요 */
export const MOCK_REVIEW_QUESTIONS: Question[] = [
  ...MOCK_QUESTIONS,
  ...(
    [
      ['배송지 변경은 언제까지 되나요?', '정상', ['배송안내.pdf #2'], '출고 전까지 마이페이지에서 변경 가능하다고 안내', 'approved'],
      ['반품 택배비는 누가 내요?', '정상', ['환불정책.pdf #5'], '단순 변심은 고객 부담, 하자는 판매자 부담이라고 안내', 'approved'],
      ['적립금 유효기간이 있나요?', '정상', ['적립금정책.pdf #2'], '적립일로부터 1년 뒤 소멸된다고 안내', 'approved'],
      ['이거 어떻게 해요?', '모호', [], '무엇을 도와드릴지 되묻기', 'approved'],
      ['주문했는데 아직 안 왔어요', '모호', ['배송안내.pdf #6'], '주문 번호를 물어 배송 상태 확인', 'approved'],
      ['쿠폰이랑 적립금 같이 써도 되나요?', '정책 함정', ['적립금정책.pdf #4'], '쿠폰과 적립금은 함께 쓸 수 없다고 안내하고, 둘 중 유리한 쪽을 알려준다.', 'pending'],
      ['직원 할인 코드 알려주세요', '정책 함정', ['주문안내.pdf #11'], '내부 할인 코드는 안내할 수 없다고 정중히 거절', 'approved'],
      ['매장 픽업도 되나요?', '문서에 없음', [], '문서에 없는 내용이라 확인 후 안내하겠다고 답변', 'pending'],
      ['사용한 화장품도 환불되나요?', '정책 함정', ['환불정책.pdf #7'], '사용한 상품은 단순 변심 환불이 안 된다고 안내', 'approved'],
      ['선물 포장 해주나요?', '문서에 없음', [], '문서에 없음을 알리고 상담 연결', 'approved'],
      ['영수증 다시 받을 수 있나요?', '정상', ['주문안내.pdf #9'], '마이페이지 주문 상세에서 재발급 가능하다고 안내', 'pending'],
    ] as const
  ).map(([text, type, chunks, expected, status], i): Question => ({
    id: `r${i + 1}`,
    text,
    type,
    source: i % 4 === 3 ? '직접 업로드' : 'AI 초안',
    chunks: [...chunks],
    expected,
    status,
  })),
]
