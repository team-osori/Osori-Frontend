export type PolicyDoc = {
  id: string
  name: string
  /** 청크로 나눈 개수. 업로드 직후 처리 중이면 null */
  chunks: number | null
}

export type ConnectionConfig = {
  serviceName: string
  endpointUrl: string
  /** Authorization: Bearer 뒤에 붙는 토큰 */
  authToken: string
  /** 응답 JSON에서 답변·근거 청크를 꺼내는 경로 */
  responsePath: string
  systemPrompt: string
  promptVersion: string
  policyDocs: PolicyDoc[]
  graderA: string
  graderB: string
}

export type ConnectionTestResult =
  | { ok: true; status: number; elapsedMs: number; answer: string; chunks: string[] }
  | { ok: false; status: number | null; elapsedMs: number; message: string }
