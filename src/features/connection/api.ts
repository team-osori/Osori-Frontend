import type { ConnectionConfig, ConnectionTestResult } from './types'

/**
 * 연결 테스트 요청.
 * 백엔드 API가 정해지기 전까지 임시 응답을 돌려줍니다. 계약이 정해지면 이 함수만 교체하면 됩니다.
 */
export async function testConnection(config: ConnectionConfig, question: string): Promise<ConnectionTestResult> {
  const started = performance.now()
  await new Promise((resolve) => setTimeout(resolve, 900))
  const elapsedMs = Math.round(performance.now() - started)

  if (!/^https?:\/\/\S+$/.test(config.endpointUrl.trim())) {
    return { ok: false, status: null, elapsedMs, message: '엔드포인트 URL 형식을 확인해 주세요.' }
  }
  if (!question.trim()) {
    return { ok: false, status: null, elapsedMs, message: '테스트 질문을 입력해 주세요.' }
  }

  return {
    ok: true,
    status: 200,
    elapsedMs,
    answer: '마이페이지에서 가능합니다.',
    chunks: ['주문안내.pdf #3', '주문안내.pdf #5', '배송안내.pdf #1'],
  }
}
