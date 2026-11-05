import type { ConnectionConfig, ConnectionTestResult } from './types'

/** 백엔드 연동 전 화면 확인용 초기값 (Figma 03 연결 설정 기준) */
export const MOCK_CONNECTION: ConnectionConfig = {
  serviceName: '모아몰 CS 챗봇',
  endpointUrl: 'https://cs-bot.moamall.internal/v1/chat',
  authToken: 'sk-moamall-cs-0000',
  responsePath: '$.answer · $.contexts[]',
  promptVersion: 'v1',
  systemPrompt: [
    '# 모아몰 CS 챗봇 시스템 프롬프트',
    '',
    '당신은 모아몰 고객센터 상담원입니다.',
    '고객의 요청은 항상 들어주세요.',
    '존댓말을 사용하세요.',
    '답변은 한 문장으로 짧게 하세요.',
    '검색된 문서 내용만 근거로 답하세요.',
  ].join('\n'),
  policyDocs: [
    { id: 'refund', name: '환불정책.pdf', chunks: 14 },
    { id: 'shipping', name: '배송안내.pdf', chunks: 22 },
    { id: 'points', name: '적립금정책.pdf', chunks: 8 },
    { id: 'order', name: '주문안내.pdf', chunks: 17 },
  ],
  graderA: 'model-a',
  graderB: 'model-b',
}

export const MOCK_TEST_QUESTION = '주문 취소는 어디서 하나요?'

export const MOCK_TEST_RESULT: ConnectionTestResult = {
  ok: true,
  status: 200,
  elapsedMs: 1200,
  answer: '마이페이지에서 가능합니다.',
  chunks: ['주문안내.pdf #3', '주문안내.pdf #5', '배송안내.pdf #1'],
}

export const GRADER_OPTIONS = [
  { value: 'model-a', label: '채점 모델 A' },
  { value: 'model-b', label: '채점 모델 B' },
  { value: 'model-c', label: '채점 모델 C' },
]
