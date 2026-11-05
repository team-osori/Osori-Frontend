/** 모든 요청 함수가 받을 수 있는 공통 옵션 */
export type RequestExtras = { signal?: AbortSignal }

/** 서버가 정한 ID 규칙: 영문 · 숫자 · _ · - 로 1~100자 (명세의 모든 경로 ID가 같은 규칙) */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/

export function isValidId(id: string) {
  return ID_PATTERN.test(id)
}

/**
 * URL 경로에 넣을 ID를 검사해서 돌려줍니다.
 * 규칙에 어긋난 값(공백, "../", "/" 등)은 엉뚱한 주소로 요청이 나가는 것을 막으려고 요청 전에 거절합니다.
 */
export function pathId(id: string, label = 'ID'): string {
  if (!isValidId(id)) throw new RangeError(`올바르지 않은 ${label}: ${id}`)
  return id
}
