import type { DiagnosisCause, GradingSummary, JudgeItem, UnstableItem } from './types'

/** 백엔드 연동 전 화면 확인용 (Figma 23 불안정 문항 패널 기준) */
export const MOCK_UNSTABLE_ITEMS: UnstableItem[] = [
  { id: 'u1', question: '해외 배송 상품도 교환되나요?', criterion: '근거', version: 'v3', verdicts: [true, false, true] },
  { id: 'u2', question: '적립금은 언제 소멸되나요?', criterion: '근거', version: 'v3', verdicts: [false, true, false] },
  { id: 'u3', question: '그거 언제 와요?', criterion: '응답', version: 'v3', verdicts: [true, true, false] },
  { id: 'u4', question: '쿠폰이랑 적립금 같이 써도 되나요?', criterion: '정책', version: 'v3', verdicts: [false, true, true] },
  { id: 'u5', question: '품절 상품 재입고 알림 되나요?', criterion: '응답', version: 'v3', verdicts: [true, false, false] },
]

/** 06 자동 채점 결과 (Figma 기준) */
export const MOCK_GRADING_SUMMARY: GradingSummary = {
  agreement: 87,
  unstableCount: 5,
  labeledCount: 64,
  totalCount: 67,
  metrics: [
    { key: 'retrieval', label: '검색', scores: [{ version: 'v1', score: 91 }, { version: 'v2', score: 91 }, { version: 'v3', score: 91 }] },
    { key: 'grounding', label: '근거', scores: [{ version: 'v1', score: 78 }, { version: 'v2', score: 88 }, { version: 'v3', score: 90 }] },
    { key: 'response', label: '응답', scores: [{ version: 'v1', score: 85 }, { version: 'v2', score: 83 }, { version: 'v3', score: 88 }] },
    { key: 'policy', label: '정책', scores: [{ version: 'v1', score: 72 }, { version: 'v2', score: 81 }, { version: 'v3', score: 90 }] },
  ],
  failures: [
    { version: 'v2', counts: { retrieval: 6, prompt: 10, model: 4 } },
    { version: 'v3', counts: { retrieval: 6, prompt: 3, model: 3 } },
  ],
  versions: [
    { version: 'v3', title: '지시 충돌 수정 (4번째 줄)', createdAt: '2026-11-04 14:20' },
    { version: 'v2', title: '정책 문서 우선 지시 추가', createdAt: '2026-11-02 10:05' },
    { version: 'v1', title: '초기 프롬프트', createdAt: '2026-10-30 16:40' },
  ],
  queue: { total: 18, split: 8, unstable: 5, sample: 5 },
}

/** 07 사람 판정 대기열 (Figma 기준). 첫 번째 항목은 상세 화면에 보이는 문항 */
export const MOCK_JUDGE_ITEMS: JudgeItem[] = [
  {
    id: 'j1',
    question: '사용한 화장품도 환불되나요?',
    reason: 'split',
    status: 'judging',
    tags: ['정책 함정'],
    baseAnswer: { version: 'v1', text: '네, 수령 후 7일 이내라면 반품 신청이 가능합니다. 마이페이지 > 주문내역에서 신청해 주세요.' },
    targetAnswer: {
      version: 'v2',
      text: '개봉하거나 사용한 화장품은 단순 변심으로는 환불이 어렵습니다. 제품에 하자가 있다면 고객센터로 접수해 주세요.',
    },
    chunks: [
      { id: 'c7', source: '환불정책.pdf · 청크 #7', text: '개봉하거나 사용한 화장품은 단순 변심에 의한 반품이 불가합니다.' },
      { id: 'c2', source: '환불정책.pdf · 청크 #2', text: '상품 수령 후 7일 이내 반품 신청이 가능합니다.' },
    ],
    graders: [
      { grader: '채점자 A', pass: true, comment: '청크 #7의 사용 상품 제외 조건을 정확히 반영했습니다.' },
      { grader: '채점자 B', pass: false, comment: '하자 접수 안내는 근거 청크에 없는 내용입니다.' },
    ],
  },
  { id: 'j0', question: '교환 배송비는 누가 내나요?', reason: 'sample', status: 'pass', tags: [], baseAnswer: { version: 'v1', text: '교환 배송비는 고객 변심일 경우 고객이 부담합니다.' }, targetAnswer: { version: 'v2', text: '단순 변심 교환은 왕복 배송비를 고객이 부담하고, 상품 불량은 판매자가 부담합니다.' }, chunks: [{ id: 'c11', source: '배송정책.pdf · 청크 #11', text: '단순 변심 교환의 왕복 배송비는 고객 부담입니다.' }], graders: [{ grader: '채점자 A', pass: true, comment: '배송비 부담 기준이 청크와 일치합니다.' }, { grader: '채점자 B', pass: true, comment: '근거와 일치하는 답변입니다.' }] },
  { id: 'j2', question: '해외 배송 상품도 교환되나요?', reason: 'unstable', status: 'waiting', tags: [], baseAnswer: { version: 'v1', text: '해외 배송 상품도 국내와 동일하게 7일 이내 교환됩니다.' }, targetAnswer: { version: 'v2', text: '해외 배송 상품은 수령 후 14일 이내에 교환을 신청할 수 있습니다.' }, chunks: [{ id: 'c4', source: '배송안내.pdf · 청크 #4', text: '국내 배송 기간 안내. 해외 교환 조건 청크는 검색되지 않았습니다.' }], graders: [{ grader: '채점자 A', pass: false, comment: '근거 청크에 해외 교환 조건이 없습니다.' }, { grader: '채점자 B', pass: true, comment: '답변 형식은 적절합니다.' }] },
  { id: 'j3', question: '주문 취소는 어디서 하나요?', reason: 'sample', status: 'waiting', tags: [], baseAnswer: { version: 'v1', text: '마이페이지 > 주문내역에서 취소할 수 있습니다.' }, targetAnswer: { version: 'v2', text: '마이페이지에서 가능합니다.' }, chunks: [{ id: 'c3', source: '주문안내.pdf · 청크 #3', text: '결제 완료 후 배송 준비 전까지 마이페이지 > 주문내역에서 취소할 수 있습니다.' }], graders: [{ grader: '채점자 A', pass: true, comment: '위치 안내가 맞습니다.' }, { grader: '채점자 B', pass: true, comment: '근거와 일치합니다.' }] },
  { id: 'j4', question: '그거 언제 와요?', reason: 'split', status: 'waiting', tags: [], baseAnswer: { version: 'v1', text: '어떤 주문인지 알려주시면 배송 현황을 확인해 드리겠습니다.' }, targetAnswer: { version: 'v2', text: '주문번호를 알려주시면 배송 일정을 안내해 드리겠습니다.' }, chunks: [], graders: [{ grader: '채점자 A', pass: true, comment: '모호한 질문에 되묻기로 답했습니다.' }, { grader: '채점자 B', pass: false, comment: '근거 없이 안내만 반복했습니다.' }] },
  { id: 'j5', question: '적립금은 언제 소멸되나요?', reason: 'unstable', status: 'waiting', tags: [], baseAnswer: { version: 'v1', text: '적립금은 지급일로부터 1년 후 소멸됩니다.' }, targetAnswer: { version: 'v2', text: '적립금은 지급일로부터 6개월 후 소멸됩니다.' }, chunks: [{ id: 'c1', source: '적립금정책.pdf · 청크 #1', text: '적립금은 지급일로부터 1년간 유효합니다.' }], graders: [{ grader: '채점자 A', pass: false, comment: '청크의 1년을 6개월로 잘못 옮겼습니다.' }, { grader: '채점자 B', pass: true, comment: '표현은 자연스럽습니다.' }] },
  { id: 'j6', question: '쿠폰이랑 적립금 같이 써도 되나요?', reason: 'split', status: 'waiting', tags: [], baseAnswer: { version: 'v1', text: '쿠폰과 적립금은 함께 사용할 수 있습니다.' }, targetAnswer: { version: 'v2', text: '쿠폰과 적립금은 한 주문에 함께 사용할 수 있으나 일부 쿠폰은 제외됩니다.' }, chunks: [{ id: 'c9', source: '할인정책.pdf · 청크 #9', text: '일부 쿠폰은 적립금과 중복 사용이 불가합니다.' }], graders: [{ grader: '채점자 A', pass: true, comment: '제외 조건을 언급했습니다.' }, { grader: '채점자 B', pass: false, comment: '어떤 쿠폰이 제외되는지 설명이 없습니다.' }] },
  { id: 'j7', question: '품절 상품 재입고 알림 되나요?', reason: 'sample', status: 'waiting', tags: [], baseAnswer: { version: 'v1', text: '재입고 알림 신청이 가능합니다.' }, targetAnswer: { version: 'v2', text: '상품 페이지의 알림 신청 버튼으로 재입고 알림을 받을 수 있습니다.' }, chunks: [{ id: 'c6', source: '상품안내.pdf · 청크 #6', text: '품절 상품은 상품 페이지에서 재입고 알림을 신청할 수 있습니다.' }], graders: [{ grader: '채점자 A', pass: true, comment: '근거와 일치합니다.' }, { grader: '채점자 B', pass: true, comment: '방법까지 안내했습니다.' }] },
]

/** 08 원인 진단 카드 (Figma 기준) */
export const MOCK_DIAGNOSES: DiagnosisCause[] = [
  {
    id: 'd1',
    cause: 'retrieval',
    label: '검색 원인',
    meta: '근거 실패 · 유사 문항 4건',
    question: '해외 배송 상품도 교환되나요?',
    answerBefore: '',
    answerFlag: '해외 배송 상품도 국내와 동일하게 7일 이내 교환됩니다',
    answerAfter: '.',
    chunk: { title: '검색된 청크', text: '배송안내.pdf #4 — 국내 배송 기간 안내. 해외 교환 조건 청크는 검색되지 않았습니다.' },
    note: '프롬프트로 해결 불가 — 청크 분할·색인을 확인하세요',
  },
  {
    id: 'd2',
    cause: 'prompt',
    label: '프롬프트 원인 · 지시 충돌',
    meta: '정책 실패 · 2건',
    question: '사용한 화장품도 환불되나요?',
    answerFlag: '고객 만족을 위해 환불을 도와드리겠습니다.',
    diff: [
      { number: 3, kind: 'context', text: '당신은 모아몰 고객센터 상담원입니다.' },
      { number: 4, kind: 'removed', text: '고객의 요청은 항상 들어주세요.' },
      { number: 4, kind: 'added', text: '정책 문서에 어긋나는 요청은 정중히 거절하세요.' },
      { number: 9, kind: 'context', text: '환불은 환불정책 문서를 따릅니다.' },
    ],
  },
  {
    id: 'd3',
    cause: 'prompt',
    label: '프롬프트 원인 · 지나친 간결 지시',
    meta: '응답 실패 · 1건',
    question: '주문 취소는 어디서 하나요?',
    answerFlag: '마이페이지에서 가능합니다.',
    diff: [
      { number: 6, kind: 'removed', text: '답변은 한 문장으로 짧게 하세요.' },
      { number: 6, kind: 'added', text: '간결하게 답하되, 절차가 있으면 단계와 조건을 모두 안내하세요.' },
    ],
  },
  {
    id: 'd4',
    cause: 'model',
    label: '모델 원인',
    meta: '근거 실패 · 유사 문항 3건',
    question: '적립금은 언제 소멸되나요?',
    answerBefore: '적립금은 ',
    answerFlag: '지급일로부터 6개월',
    answerAfter: ' 후 소멸됩니다.',
    chunk: { title: '검색된 청크 (정상)', text: '적립금정책.pdf #1 — 적립금은 지급일로부터 1년간 유효합니다.' },
    note: '청크와 지시는 맞지만 모델이 수치를 잘못 옮겼습니다',
  },
]
