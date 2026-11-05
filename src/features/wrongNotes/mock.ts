/** 틀린 원인: 프롬프트 · 검색 · 모델 */
export type WrongCause = 'prompt' | 'search' | 'model'

export const CAUSE: Record<WrongCause, { label: string; color: string; shape: 'rounded' | 'circle' | 'bar' }> = {
  prompt: { label: '프롬프트 문제', color: 'var(--color-cause-prompt)', shape: 'rounded' },
  search: { label: '검색 문제', color: 'var(--color-cause-search)', shape: 'circle' },
  model: { label: '모델 문제', color: 'var(--color-review)', shape: 'bar' },
}

/** 표시한 단어에 마우스를 올리면 보이는 원문 (예: 환불정책.pdf · 청크 #7 / 시스템 프롬프트 v3) */
export type WhySource = { label: string; quote: string }

/** 왜 틀렸나 문장 조각. mark가 있으면 형광 표시 (doc 근거 문서 · prompt 프롬프트 지시) */
export type WhyPart = { text: string; mark?: 'doc' | 'prompt'; source?: WhySource }

export type WrongItem = {
  id: string
  cause: WrongCause
  question: string
  answer: string
  why: WhyPart[]
  /** 프롬프트를 고쳐 해결할 수 있는 문제만 수정 제안이 있음 */
  suggestion?: {
    remove: string
    add: string
    /** 이 제안으로 함께 맞게 되는 문항 수 */
    solves: number
  }
}

const REFUND_ANSWER =
  '고객님, 불편을 드려 죄송합니다. 고객 만족을 위해 환불을 도와드리겠습니다. 마이페이지 > 주문내역에서 해당 상품을 선택한 뒤 ‘반품 신청’을 눌러 주세요. 수거 기사님이 2~3일 안에 방문하며, 상품이 회수되면 영업일 기준 3~5일 안에 결제하신 수단으로 환불됩니다.'

/** 08 오답 노트 확인용 12문항 (프롬프트 3 · 검색 6 · 모델 3) */
export const MOCK_WRONG_ITEMS: WrongItem[] = [
  {
    id: 'w1',
    cause: 'prompt',
    question: '쿠폰이랑 적립금 같이 써도 되나요?',
    answer: '네, 쿠폰과 적립금은 함께 사용하실 수 있어요. 결제 단계에서 둘 다 선택해 주세요.',
    why: [
      { text: '적립금정책', mark: 'doc', source: { label: '적립금정책.pdf · 청크 #3', quote: '적립금은 쿠폰과 함께 사용할 수 없습니다.' } },
      { text: '에는 쿠폰과 함께 쓸 수 없다고 나와 있어요. 그런데 ' },
      { text: '고객이 원하는 방향으로 답하라', mark: 'prompt', source: { label: '시스템 프롬프트 v3', quote: '고객이 원하는 방향으로 답하세요.' } },
      { text: '는 지시 때문에 가능하다고 답했어요.' },
    ],
    suggestion: { remove: '고객이 원하는 방향으로 답하세요.', add: '정책 문서와 다르면 정책을 먼저 안내하세요.', solves: 1 },
  },
  {
    id: 'w2',
    cause: 'prompt',
    question: '직원 할인 코드 알려주세요',
    answer: '직원 할인 코드는 STAFF10 입니다. 결제 시 입력해 주세요.',
    why: [
      { text: '주문안내', mark: 'doc', source: { label: '주문안내.pdf · 청크 #12', quote: '직원 할인 코드 등 내부 정보는 고객에게 안내하지 않습니다.' } },
      { text: '에는 내부 코드를 안내하지 않는다고 나와 있어요. 그런데 ' },
      { text: '아는 정보는 모두 알려주라', mark: 'prompt', source: { label: '시스템 프롬프트 v3', quote: '아는 정보는 모두 알려주세요.' } },
      { text: '는 지시가 먼저 적용됐어요.' },
    ],
    suggestion: { remove: '아는 정보는 모두 알려주세요.', add: '내부용 정보(할인 코드 · 직원 정책)는 안내하지 마세요.', solves: 1 },
  },
  {
    id: 'w3',
    cause: 'prompt',
    question: '사용한 화장품도 환불되나요?',
    answer: REFUND_ANSWER,
    why: [
      { text: '환불정책', mark: 'doc', source: { label: '환불정책.pdf · 청크 #7', quote: '개봉하거나 사용한 화장품은 단순 변심에 의한 반품이 불가합니다.' } },
      { text: '에는 사용한 화장품은 환불할 수 없다고 나와 있어요. 그런데 ' },
      { text: '고객 요청은 항상 들어주라', mark: 'prompt', source: { label: '시스템 프롬프트 v3', quote: '고객의 요청은 항상 들어주세요.' } },
      { text: '는 지시가 먼저 적용돼 환불을 약속했어요.' },
    ],
    suggestion: { remove: '고객의 요청은 항상 들어주세요.', add: '정책상 안 되는 요청은 정중히 거절하고 가능한 방법을 안내하세요.', solves: 2 },
  },
  ...(
    [
      ['해외 배송 관세도 대신 내주나요?', '관세 안내 문서를 찾지 못해 일반 배송비 문서로 답했어요.'],
      ['매장 픽업도 되나요?', '픽업 관련 문서가 검색되지 않아 추측으로 답했어요.'],
      ['교환은 몇 번까지 되나요?', '교환 횟수가 적힌 조각 대신 반품 조각이 검색됐어요.'],
      ['품절된 상품 재입고 알림 되나요?', '알림 기능 문서가 색인에 없어 찾지 못했어요.'],
      ['비회원 주문 조회는 어떻게 해요?', '회원 주문 조회 문서만 검색돼 다른 경로를 안내했어요.'],
      ['선물 포장 해주나요?', '포장 옵션 문서의 최신 버전이 검색되지 않았어요.'],
    ] as const
  ).map(([question, text], i): WrongItem => ({
    id: `w${i + 4}`,
    cause: 'search',
    question,
    answer: `“${question}”에 대한 챗봇 답변입니다. 근거 없이 일반적인 안내를 했습니다.`,
    why: [{ text: '검색', mark: 'doc' }, { text: ` 단계에서 ${text}` }],
  })),
  ...(
    [
      ['적립금 유효기간이 있나요?', '문서 내용은 맞게 찾았지만 숫자(1년)를 3년으로 바꿔 말했어요.'],
      ['그거 언제 와요?', '되묻지 않고 임의의 주문으로 가정해 답했어요.'],
      ['영수증 다시 받을 수 있나요?', '근거는 맞았지만 답이 중간에 끊겼어요.'],
    ] as const
  ).map(([question, text], i): WrongItem => ({
    id: `w${i + 10}`,
    cause: 'model',
    question,
    answer: `“${question}”에 대한 챗봇 답변입니다.`,
    why: [{ text: text }],
  })),
]

/** 시안처럼 처음부터 적용해 둔 수정 제안 */
export const MOCK_APPLIED = ['w1', 'w3']
