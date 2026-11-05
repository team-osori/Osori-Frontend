import { useState, type FormEvent } from 'react'
import { TextField } from '../../components/ui'
import { AuthHint, AuthLayout, AuthSwitch } from '../../layouts/AuthLayout'

type Credentials = { email: string; password: string }

type LoginPageProps = {
  /** 로그인에 실패하면 비밀번호 칸 아래에 보여줄 문구를 돌려줍니다. 성공하면 아무것도 돌려주지 않습니다. */
  onLogin?: (credentials: Credentials) => string | void | Promise<string | void>
  initialEmail?: string
  /** 처음부터 오류 상태로 보여줄 문구 (11 로그인 오류) */
  initialError?: string
}

/** 01 로그인 · 11 로그인 오류 */
export function LoginPage({ onLogin, initialEmail = '', initialError }: LoginPageProps) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(initialError)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      setError((await onLogin?.({ email, password })) || undefined)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="로그인"
      subtitle="팀 계정으로 로그인하세요."
      submitLabel="로그인"
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
        label="이메일"
        size="lg"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="이메일을 입력하세요"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
