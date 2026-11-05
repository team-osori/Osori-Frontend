import type { ConnectionInput, ConnectionResponse } from './connectionApi'

/**
 * 화면에서 입력하는 서비스 연결 값. 서버 형식(ConnectionInput)과는 toConnectionInput · fromConnection으로 바꿉니다.
 *
 * 위치(포인터)는 RFC 6901 JSON Pointer입니다. 예: 응답이 {"answer": "...", "contexts": [...]}이면 답변 위치는 /answer
 */
export type EndpointForm = {
  endpointUrl: string
  /** 인증 키(예: RAG 서버의 X-API-Key 값). 서버는 저장된 키를 다시 돌려주지 않아서, 비워 두면 기존 키를 그대로 둡니다. */
  authKey: string
  /** 인증 키를 실어 보낼 헤더 이름. 바꾸면 서버가 저장된 키를 지웁니다. */
  authHeaderName: string
  /** 답변 생성용 AI API 키(OpenAI). 서버는 저장된 키를 돌려주지 않아서, 비워 두면 기존 키를 그대로 둡니다. */
  aiKey: string
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

/**
 * 평가 대상 RAG 서버(rag-server)의 POST /query 형식에 맞춘 기본값.
 * 요청 {"question", "prompt"} → 응답 {"answer", "chunks": [...]}, 인증은 X-API-Key 헤더
 */
export const DEFAULT_ENDPOINT_FORM: EndpointForm = {
  endpointUrl: '',
  authKey: '',
  authHeaderName: 'X-API-Key',
  aiKey: '',
  requestTemplate: '{\n  "question": "",\n  "prompt": ""\n}',
  questionPointer: '/question',
  promptPointer: '/prompt',
  answerPointer: '/answer',
  retrievalPointer: '/chunks',
}

/** RAG 서버가 답변 생성용 OpenAI 키를 받는 헤더 (rag-server #1) */
export const LLM_KEY_HEADER = 'X-OpenAI-Key'

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
    authKey: '',
    authHeaderName: connection.auth.type === 'HEADER' ? (connection.auth.headerName ?? '') : DEFAULT_ENDPOINT_FORM.authHeaderName,
    aiKey: '',
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
  if (!/^[A-Za-z0-9-]{1,100}$/.test(form.authHeaderName.trim())) errors.authHeaderName = '영문 · 숫자 · 하이픈으로 된 헤더 이름을 입력해 주세요.'
  const pointer = (value: string) => value === '' || value.startsWith('/')
  if (!form.questionPointer.trim() || !pointer(form.questionPointer.trim())) errors.questionPointer = '/로 시작하는 위치를 입력해 주세요.'
  if (!pointer(form.promptPointer.trim())) errors.promptPointer = '/로 시작하는 위치를 입력해 주세요.'
  if (!form.answerPointer.trim() || !pointer(form.answerPointer.trim())) errors.answerPointer = '/로 시작하는 위치를 입력해 주세요.'
  if (!pointer(form.retrievalPointer.trim())) errors.retrievalPointer = '/로 시작하는 위치를 입력해 주세요.'
  return errors
}

/** 지금 저장된 인증 키가 이 화면의 헤더 이름과 같은 헤더로 저장돼 있는지 */
function hasSavedKey(form: EndpointForm, saved: ConnectionResponse | null) {
  return Boolean(
    saved?.auth.secretConfigured && saved.auth.type === 'HEADER' && saved.auth.headerName?.toLowerCase() === form.authHeaderName.trim().toLowerCase(),
  )
}

/**
 * 화면 값을 서버에 보낼 설정으로. validateEndpointForm을 통과한 값만 넘겨야 합니다.
 * 키를 새로 넣었거나 같은 헤더로 저장된 키가 있으면 헤더 인증, 아니면 인증 없음으로 보냅니다.
 */
export function toConnectionInput(form: EndpointForm, saved: ConnectionResponse | null): ConnectionInput {
  const useKey = form.authKey.trim() !== '' || hasSavedKey(form, saved)
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
    auth: useKey ? { type: 'HEADER', headerName: form.authHeaderName.trim() } : { type: 'NONE' },
    timeoutMs: saved?.timeoutMs ?? DEFAULT_REST.timeoutMs,
    maxRetries: saved?.maxRetries ?? DEFAULT_REST.maxRetries,
    retrySafe: saved?.retrySafe ?? DEFAULT_REST.retrySafe,
    // 예전 서버는 이 값을 모르면 거절하므로, AI 키를 쓰거나 이미 쓰고 있을 때만 보냄
    ...(form.aiKey.trim() || saved?.llmKeyHeaderName ? { llmKeyHeaderName: saved?.llmKeyHeaderName ?? LLM_KEY_HEADER } : {}),
  }
}
