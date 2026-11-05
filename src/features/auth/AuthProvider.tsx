import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getTokens, onTokensChange } from '../../lib/api'
import * as authApi from './api'
import type { LoginInput, SignupInput, User } from './api'

/** checking: 저장된 토큰으로 로그인 상태를 확인하는 중 */
export type AuthStatus = 'checking' | 'signedIn' | 'signedOut'

type AuthContextValue = {
  status: AuthStatus
  /** 로그인했지만 아직 내 정보를 못 받았으면 null */
  user: User | null
  login: (input: LoginInput) => Promise<User>
  /** 계정을 만들고 같은 아이디 · 비밀번호로 바로 로그인 */
  signup: (input: SignupInput) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() => (getTokens() ? 'checking' : 'signedOut'))
  const [user, setUser] = useState<User | null>(null)

  // 앱을 열 때 저장된 토큰이 있으면 내 정보로 로그인 상태 복원
  useEffect(() => {
    if (!getTokens()) return
    const controller = new AbortController()
    authApi
      .fetchMe(controller.signal)
      .then((me) => {
        setUser(me)
        setStatus('signedIn')
      })
      .catch(() => {
        if (controller.signal.aborted) return
        // 토큰이 만료돼 지워졌으면 로그아웃, 네트워크 문제 등으로 남아 있으면 로그인 상태 유지
        setStatus(getTokens() ? 'signedIn' : 'signedOut')
      })
    return () => controller.abort()
  }, [])

  // 토큰이 지워지면(로그아웃 · 만료) 바로 로그아웃 상태로
  useEffect(
    () =>
      onTokensChange((tokens) => {
        if (tokens) return
        setUser(null)
        setStatus('signedOut')
      }),
    [],
  )

  const login = useCallback(async (input: LoginInput) => {
    const me = await authApi.login(input)
    setUser(me)
    setStatus('signedIn')
    return me
  }, [])

  const signup = useCallback(
    async (input: SignupInput) => {
      await authApi.signup(input)
      return login({ loginId: input.loginId, password: input.password })
    },
    [login],
  )

  const logout = useCallback(() => authApi.logout(), [])

  const value = useMemo(() => ({ status, user, login, signup, logout }), [status, user, login, signup, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다.')
  return value
}
