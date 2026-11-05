import { useState, type FormEvent } from 'react'
import { TextField } from '../../components/ui'
import { isValidLoginId } from '../../features/auth'
import { AuthHint, AuthLayout, AuthSwitch } from '../../layouts/AuthLayout'

type Credentials = { loginId: string; password: string }

type LoginPageProps = {
  /** 로그인에 실패하면 비밀번호 칸 아래에 보여줄 문구를 돌려줍니다. 성공하면 아무것도 돌려주지 않습니다. */
  onLogin?: (credentials: Credentials) => string | void | Promise<string | void>
  initialLoginId?: string
  /** 처음부터 오류 상태로 보여줄 문구 (11 로그인 오류) */
  initialError?: string
}

/** 01 로그인 · 11 로그인 오류 */
export function LoginPage({ onLogin, initialLoginId = '', initialError }: LoginPageProps) {
  const [loginId, setLoginId] = useState(initialLoginId)
  const [password, setPassword] = useState('')
  const [loginIdError, setLoginIdError] = useState<string>()
  const [error, setError] = useState(initialError)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = loginId.trim()
    if (!id) return setLoginIdError('아이디를 입력하세요.')
    if (!isValidLoginId(id)) return setLoginIdError('아이디를 확인해 주세요.')
    if (!password) return setError('비밀번호를 입력하세요.')

    setSubmitting(true)
    try {
      setError((await onLogin?.({ loginId: id, password })) || undefined)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="로그인"
      subtitle="팀 계정으로 로그인하세요."
      submitLabel={submitting ? '로그인 중…' : '로그인'}
      onSubmit={handleSubmit}
      submitting={submitting}
      footer={
        <>
          <AuthSwitch prompt="계정이 없으신가요?" linkLabel="회원가입" href="#/signup" />
          <AuthHint>비밀번호를 잊으셨나요? 인스턴스 관리자에게 문의하세요.</AuthHint>
        </>
      }
    >
      <TextField
        label="아이디"
        size="lg"
        name="loginId"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="아이디를 입력하세요"
        value={loginId}
        error={loginIdError}
        onChange={(e) => {
          setLoginId(e.target.value)
          setLoginIdError(undefined)
          setError(undefined)
        }}
      />
      <TextField
        label="비밀번호"
        size="lg"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="비밀번호를 입력하세요"
        value={password}
        error={error}
        onChange={(e) => {
          setPassword(e.target.value)
          setError(undefined)
        }}
      />
    </AuthLayout>
  )
}
