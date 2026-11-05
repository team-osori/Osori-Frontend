/**
 * 로그인 토큰 보관. 새로고침해도 로그인이 유지되도록 localStorage에 저장합니다.
 * 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 메모리에만 둡니다.
 */

export type Tokens = { accessToken: string; refreshToken: string }

const KEY = 'osori.tokens'

let memory: Tokens | null = load()
const listeners = new Set<(tokens: Tokens | null) => void>()

function load(): Tokens | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Tokens>
    return parsed.accessToken && parsed.refreshToken
      ? { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken }
      : null
  } catch {
    return null
  }
}

function save(tokens: Tokens | null) {
  try {
    if (tokens) localStorage.setItem(KEY, JSON.stringify(tokens))
    else localStorage.removeItem(KEY)
  } catch {
    // 저장소를 못 써도 메모리 값으로 계속 동작
  }
}

export function getTokens() {
  return memory
}

export function setTokens(tokens: Tokens | null) {
  memory = tokens
  save(tokens)
  listeners.forEach((listener) => listener(tokens))
}

export function clearTokens() {
  setTokens(null)
}

/** 토큰이 바뀌거나 지워질 때 알림. 반환한 함수를 부르면 구독 해제 */
export function onTokensChange(listener: (tokens: Tokens | null) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
