import type { ErrorDetail, FieldError } from './types'

/** 네트워크 오류처럼 서버 응답을 받지 못했을 때의 코드 */
export const NETWORK_ERROR = 'NETWORK_ERROR'

/**
 * API 실패. 서버의 { error: { code, message, requestId, fieldErrors } }를 그대로 담습니다.
 * status는 HTTP 상태 코드이고, 응답을 받지 못했으면 0입니다.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId?: string
  readonly fieldErrors: FieldError[]

  constructor(status: number, detail: Partial<ErrorDetail> & { message: string }) {
    super(detail.message)
    this.name = 'ApiError'
    this.status = status
    this.code = detail.code ?? 'UNKNOWN'
    this.requestId = detail.requestId
    this.fieldErrors = detail.fieldErrors ?? []
  }

  /** 다른 사람이 먼저 고쳐서 revision이 맞지 않음 (다시 불러와야 함) */
  get isConflict() {
    return this.status === 409 || this.status === 412
  }

  get isUnauthorized() {
    return this.status === 401
  }

  /** 입력창 이름별 오류 메시지 { loginId: '...', password: '...' } */
  fieldMessages(): Record<string, string> {
    const messages: Record<string, string> = {}
    for (const error of this.fieldErrors) {
      if (!(error.field in messages)) messages[error.field] = error.message
    }
    return messages
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** 화면에 보여줄 오류 문구 */
export function errorMessage(error: unknown, fallback = '잠시 후 다시 시도해 주세요.') {
  if (isApiError(error)) {
    if (error.code === NETWORK_ERROR) return '서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.'
    return error.message || fallback
  }
  return fallback
}
