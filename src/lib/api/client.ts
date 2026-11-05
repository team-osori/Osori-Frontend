import { ApiError, NETWORK_ERROR } from './ApiError'
import { clearTokens, getTokens, setTokens, type Tokens } from './tokens'
import type { DataEnvelope, ErrorDetail } from './types'

/** 비어 있으면 같은 출처의 /api (개발 중에는 Vite 프록시가 백엔드로 넘김) */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const REFRESH_PATH = '/api/auth/refresh'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type QueryValue = string | number | boolean | null | undefined

export type RequestOptions = {
  method?: Method
  query?: Record<string, QueryValue>
  /** JSON으로 보낼 본문. FormData면 그대로 보냄 */
  body?: unknown
  /** 낙관적 잠금. 삭제 요청의 If-Match 헤더 (형식은 백엔드가 정한 값 그대로) */
  ifMatch?: string | number
  /**
   * 같은 요청이 두 번 실행되지 않게 하는 Idempotency-Key.
   * true면 새로 만들고, 재시도할 때도 같은 키를 다시 쓰려면 문자열로 넘깁니다.
   */
  idempotencyKey?: string | true
  /** false면 Authorization 헤더를 붙이지 않음 (로그인 · 회원가입) */
  auth?: boolean
  signal?: AbortSignal
}

/** 토큰 갱신도 실패해서 다시 로그인해야 할 때 부를 함수 (App이 로그인 화면으로 보냄) */
let onSessionExpired: (() => void) | null = null

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler
}

/** 중복 실행 방지 키 */
export function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

async function readError(response: Response): Promise<ApiError> {
  let detail: Partial<ErrorDetail> | undefined
  try {
    const body = (await response.json()) as { error?: ErrorDetail }
    detail = body.error
  } catch {
    // 본문이 JSON이 아니면 상태 코드로만 오류를 만듦
  }
  return new ApiError(response.status, { ...detail, message: detail?.message || `요청에 실패했습니다. (${response.status})` })
}

async function send(path: string, options: RequestOptions, idempotencyKey: string | undefined): Promise<Response> {
  const { method = 'GET', query, body, ifMatch, auth = true, signal } = options
  const headers = new Headers({ Accept: 'application/json' })
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !isForm) headers.set('Content-Type', 'application/json')
  if (ifMatch !== undefined) headers.set('If-Match', String(ifMatch))
  if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey)
  const token = auth ? getTokens()?.accessToken : undefined
  if (token) headers.set('Authorization', `Bearer ${token}`)

  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, { code: NETWORK_ERROR, message: '서버에 연결할 수 없습니다.' })
  }
}

/** 동시에 여러 요청이 401을 받아도 갱신은 한 번만 하도록 진행 중인 갱신을 공유 */
let refreshing: Promise<boolean> | null = null

function refreshTokens(): Promise<boolean> {
  const refreshToken = getTokens()?.refreshToken
  if (!refreshToken) return Promise.resolve(false)
  refreshing ??= (async () => {
    try {
      const response = await send(REFRESH_PATH, { method: 'POST', body: { refreshToken }, auth: false }, undefined)
      if (!response.ok) return false
      const { data } = (await response.json()) as DataEnvelope<Tokens>
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
      return true
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/**
 * 서비스 백엔드 요청. 성공하면 응답의 data를 돌려주고, 실패하면 ApiError를 던집니다.
 * 401이면 토큰을 한 번 갱신해서 다시 보내고, 그래도 실패하면 로그아웃 처리합니다.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const key = options.idempotencyKey === true ? createIdempotencyKey() : options.idempotencyKey
  let response = await send(path, options, key)

  const canRefresh = options.auth !== false && path !== REFRESH_PATH && getTokens() !== null
  if (response.status === 401 && canRefresh) {
    if (await refreshTokens()) {
      // 같은 Idempotency-Key로 다시 보내서 서버가 중복 실행하지 않게 함
      response = await send(path, options, key)
    } else {
      clearTokens()
      onSessionExpired?.()
    }
  }

  if (!response.ok) throw await readError(response)
  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (!text) return undefined as T
  const json = JSON.parse(text) as unknown
  return (json && typeof json === 'object' && 'data' in json ? (json as DataEnvelope<T>).data : json) as T
}

type BodyOptions = Omit<RequestOptions, 'method' | 'body'>

/** 자주 쓰는 메서드 모음 */
export const api = {
  get: <T>(path: string, options?: Omit<BodyOptions, 'idempotencyKey'>) => apiRequest<T>(path, options),
  post: <T>(path: string, body?: unknown, options?: BodyOptions) => apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: BodyOptions) => apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: BodyOptions) => apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T = void>(path: string, options?: BodyOptions) => apiRequest<T>(path, { ...options, method: 'DELETE' }),
}
