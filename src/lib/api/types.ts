import type { components } from './schema'

/** 백엔드 스키마 이름으로 타입 꺼내기. 예: Schema<'ProjectResponse'> */
export type Schema<Name extends keyof components['schemas']> = components['schemas'][Name]

export type ErrorDetail = Schema<'ErrorDetail'>
export type FieldError = Schema<'FieldError'>

/** 목록 응답의 커서 페이지. 다음 페이지가 없으면 nextCursor가 null */
export type Page<T> = {
  items: T[]
  nextCursor: string | null
}

/** 목록 요청 공통 쿼리 */
export type PageQuery = {
  limit?: number
  cursor?: string | null
}

/** 성공 응답 공통 껍데기 { data } */
export type DataEnvelope<T> = { data: T }
