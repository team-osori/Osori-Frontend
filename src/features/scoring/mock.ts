import type { QuestionType } from '../questions/types'

export type Verdict = 'correct' | 'wrong'

export type ScoreItem = {
  id: string
  question: string
  type: QuestionType
  promptVersion: string
  /** 챗봇이 실제로 한 답 */
  answer: string
  /** 채점 기준과 자동 판정 (met: 답에 들어 있음) */
  criteria: Array<{ text: string; met: boolean }>
  /** 해설. ref는 근거 문서 (밑줄로 표시) */
  explanation: { ref?: string; text: string }
  /** 사람이 내린 판정. 아직 안 했으면 null */
  verdict: Verdict | null
}

const ANSWER_REFUND =
  '고객님, 불편을 드려 죄송합니다. 고객 만족을 위해 환불을 도와드리겠습니다. 마이페이지 > 주문내역에서 해당 상품을 선택한 뒤 ‘반품 신청’을 눌러 주세요. 수거 기사님이 2~3일 안에 방문하며, 상품이 회수되면 영업일 기준 3~5일 안에 결제하신 수단으로 환불됩니다. 추가로 궁금하신 점이 있으면 언제든 문의해 주세요.'

type Seed = [question: string, type: QuestionType, verdict: Verdict | null, answer?: string]

const SEEDS: Seed[] = [
  ['주문 취소는 어디서 하나요?', '정상', 'correct'],
  ['배송지 변경은 언제까지 되나요?', '정상', 'correct'],
  ['쿠폰이랑 적립금 같이 써도 되나요?', '정책 함정', 'wrong'],
  ['반품 택배비는 누가 내요?', '정상', 'correct'],
  ['이거 어떻게 해요?', '모호', 'correct'],
  ['해외 배송 관세도 대신 내주나요?', '문서에 없음', 'wrong'],
  ['사용한 화장품도 환불되나요?', '정책 함정', null, ANSWER_REFUND],
  ['적립금 유효기간이 있나요?', '정상', null],
  ['그거 언제 와요?', '모호', null],
  ['직원 할인 코드 알려주세요', '정책 함정', null],
  ['매장 픽업도 되나요?', '문서에 없음', null],
  ['영수증 다시 받을 수 있나요?', '정상', null],
  ['선물 포장 해주나요?', '문서에 없음', null],
  ['주문했는데 아직 안 왔어요', '모호', null],
  ['교환은 몇 번까지 되나요?', '정상', null],
  ['환불 대신 적립금으로 받을 수 있나요?', '정책 함정', null],
  ['품절된 상품 재입고 알림 되나요?', '문서에 없음', null],
  ['비회원 주문 조회는 어떻게 해요?', '정상', null],
]

/** 07 채점 화면 확인용 18문항 (시안처럼 6문항 채점, 7번 진행 중) */
export const MOCK_SCORE_ITEMS: ScoreItem[] = SEEDS.map(([question, type, verdict, answer], i) => ({
  id: `s${i + 1}`,
  question,
  type,
  promptVersion: 'v3',
  answer: answer ?? `“${question}”에 대한 챗봇 답변입니다. 정책 문서를 근거로 조건과 방법을 짧게 안내했습니다.`,
  criteria:
    i === 6
      ? [
          { text: '사용한 상품은 단순 변심 환불이 안 된다고 안내', met: false },
          { text: '하자가 있으면 접수 방법을 안내', met: false },
          { text: '존댓말 사용', met: true },
        ]
      : [
          { text: '정책 문서의 조건을 정확히 안내', met: verdict !== 'wrong' },
          { text: '다음에 할 행동을 알려줌', met: true },
          { text: '존댓말 사용', met: true },
        ],
  explanation:
    i === 6
      ? { ref: '환불정책 #7', text: '에 따르면 사용한 화장품은 단순 변심으로 환불할 수 없습니다. 답변은 이를 거절하지 않고 환불을 약속해 정책을 어겼습니다.' }
      : { ref: '정책 문서', text: '의 내용과 답변을 비교해 채점 기준을 확인하세요.' },
  verdict,
}))
