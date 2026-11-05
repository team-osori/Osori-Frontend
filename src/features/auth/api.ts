import { api, clearTokens, getTokens, setTokens, type Schema } from '../../lib/api'

export type User = Schema<'UserResponse'>
export type SignupInput = Schema<'SignupRequest'>
export type LoginInput = Schema<'LoginRequest'>

type LoginResponse = Schema<'LoginResponse'>
type Availability = Schema<'Availability'>

/** 아이디를 쓸 수 있는지 (대소문자는 서버가 같은 것으로 봄) */
export async function checkLoginId(loginId: string, signal?: AbortSignal) {
  const result = await api.get<Availability>('/api/auth/login-id-availability', {
    auth: false,
    query: { loginId },
    signal,
  })
  return result.available
}

export function signup(input: SignupInput) {
  return api.post<User>('/api/auth/signup', input, { auth: false })
}

/** 로그인하고 받은 토큰을 저장합니다. */
export async function login(input: LoginInput) {
  const result = await api.post<LoginResponse>('/api/auth/login', input, { auth: false })
  setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken })
  return result.user
}

export function fetchMe(signal?: AbortSignal) {
  return api.get<User>('/api/auth/me', { signal })
}

/** 서버의 로그인 세션을 끝내고 토큰을 지웁니다. 서버 요청이 실패해도 이 기기에서는 로그아웃됩니다. */
export async function logout() {
  const refreshToken = getTokens()?.refreshToken
  try {
    if (refreshToken) await api.post<void>('/api/auth/logout', { refreshToken }, { auth: false })
  } finally {
    clearTokens()
  }
}
