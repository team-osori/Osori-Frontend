import type { ConnectionInput, ConnectionResponse } from './connectionApi'

/**
 * 화면에서 입력하는 서비스 연결 값. 서버 형식(ConnectionInput)과는 toConnectionInput · fromConnection으로 바꿉니다.
 *
 * 위치(포인터)는 RFC 6901 JSON Pointer입니다. 예: 응답이 {"answer": "...", "contexts": [...]}이면 답변 위치는 /answer
 */
export type EndpointForm = {
  endpointUrl: string
  /** Authorization: Bearer 뒤에 붙는 토큰. 서버는 저장된 토큰을 다시 돌려주지 않아서, 비워 두면 기존 토큰을 그대로 둡니다. */
  authToken: string
  /** 챗봇에 보낼 요청 본문(JSON). 질문 · 프롬프트 위치의 값은 실행할 때 채워집니다. */
  requestTemplate: string
  /** 요청 본문에서 질문을 넣을 위치 */
  questionPointer: string
  /** 요청 본문에서 시스템 프롬프트를 넣을 위치 */
  promptPointer: string
  /** 응답에서 답변을 읽을 위치 */
  answerPointer: string
  /** 응답에서 근거 문서를 읽을 위치 (선택) */
  retrievalPointer: string
}

/** 백엔드 인계 문서의 예시 설정과 같은 기본값 */
export const DEFAULT_ENDPOINT_FORM: EndpointForm = {
  endpointUrl: '',
  authToken: '',
  requestTemplate: '{\n  "question": "",\n  "systemPrompt": ""\n}',
  questionPointer: '/question',
  promptPointer: '/systemPrompt',
  answerPointer: '/answer',
  retrievalPointer: '',
}

/** 화면에서 바꾸지 않는 값. 이미 저장된 설정이 있으면 그 값을 유지합니다. */
const DEFAULT_REST = {
  executionMode: 'PROMPT_BODY',
  headers: { 'Content-Type': 'application/json' },
  timeoutMs: 10_000,
  maxRetries: 0,
  retrySafe: false,
} as const

/** 저장된 설정을 화면 값으로. 토큰은 서버가 돌려주지 않으므로 항상 빈 값입니다. */
export function fromConnection(connection: ConnectionResponse): EndpointForm {
  return {
    endpointUrl: connection.url,
    authToken: '',
    requestTemplate: JSON.stringify(connection.requestTemplate, null, 2),
    questionPointer: connection.questionPointer,
    promptPointer: connection.promptPointer ?? '',
    answerPointer: connection.answerPointer,
    retrievalPointer: connection.retrievalPointer ?? '',
  }
}

/** 입력값 검사. 문제가 없으면 빈 객체 */
export function validateEndpointForm(form: EndpointForm): Partial<Record<keyof EndpointForm, string>> {
  const errors: Partial<Record<keyof EndpointForm, string>> = {}
  if (!/^https:\/\/\S+$/.test(form.endpointUrl.trim())) errors.endpointUrl = 'https://로 시작하는 주소를 입력해 주세요.'
  try {
    const parsed: unknown = JSON.parse(form.requestTemplate)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) errors.requestTemplate = 'JSON 객체({ … })로 입력해 주세요.'
  } catch {
    errors.requestTemplate = 'JSON 형식이 올바르지 않습니다.'
  }
  const pointer = (value: string) => value === '' || value.startsWith('/')
  if (!form.questionPointer.trim() || !pointer(form.questionPointer.trim())) errors.questionPointer = '/로 시작하는 위치를 입력해 주세요.'
  if (!pointer(form.promptPointer.trim())) errors.promptPointer = '/로 시작하는 위치를 입력해 주세요.'
  if (!form.answerPointer.trim() || !pointer(form.answerPointer.trim())) errors.answerPointer = '/로 시작하는 위치를 입력해 주세요.'
  if (!pointer(form.retrievalPointer.trim())) errors.retrievalPointer = '/로 시작하는 위치를 입력해 주세요.'
  return errors
}

/**
 * 화면 값을 서버에 보낼 설정으로. validateEndpointForm을 통과한 값만 넘겨야 합니다.
 * 토큰을 새로 넣었거나 이미 저장된 토큰이 있으면 Bearer 인증, 아니면 인증 없음으로 보냅니다.
 */
export function toConnectionInput(form: EndpointForm, saved: ConnectionResponse | null): ConnectionInput {
  const useBearer = form.authToken.trim() !== '' || (saved?.auth.type === 'BEARER' && saved.auth.secretConfigured)
  const promptPointer = form.promptPointer.trim()
  const retrievalPointer = form.retrievalPointer.trim()
  return {
    executionMode: saved?.executionMode === 'CONNECTION_ONLY' ? 'CONNECTION_ONLY' : DEFAULT_REST.executionMode,
    url: form.endpointUrl.trim(),
    headers: saved?.headers ?? DEFAULT_REST.headers,
    requestTemplate: JSON.parse(form.requestTemplate) as Record<string, unknown>,
    questionPointer: form.questionPointer.trim(),
    answerPointer: form.answerPointer.trim(),
    promptPointer: promptPointer || null,
    retrievalPointer: retrievalPointer || null,
    auth: { type: useBearer ? 'BEARER' : 'NONE' },
    timeoutMs: saved?.timeoutMs ?? DEFAULT_REST.timeoutMs,
    maxRetries: saved?.maxRetries ?? DEFAULT_REST.maxRetries,
    retrySafe: saved?.retrySafe ?? DEFAULT_REST.retrySafe,
  }
}
