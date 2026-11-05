import { useState, type ChangeEvent, type FormEvent } from 'react'
import { TextField } from '../../components/ui'
import { AuthLayout, AuthSwitch } from '../../layouts/AuthLayout'

const PASSWORD_RULE = '8자 이상 · 영문과 숫자 포함'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 8자 이상, 영문과 숫자를 모두 포함 */
function isValidPassword(password: string) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
}

type Values = { name: string; email: string; password: string; passwordConfirm: string }
type Errors = Partial<Record<keyof Values, string>>

function validate({ name, email, password, passwordConfirm }: Values): Errors {
  const errors: Errors = {}
  if (!name.trim()) errors.name = '이름을 입력하세요.'
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = '올바른 이메일을 입력하세요.'
  if (!isValidPassword(password)) errors.password = `비밀번호는 ${PASSWORD_RULE}이어야 합니다.`
  if (password !== passwordConfirm) errors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  return errors
}

type SignupPageProps = {
  /** 입력값이 모두 올바를 때 호출됩니다. */
  onSignup?: (values: Omit<Values, 'passwordConfirm'>) => void | Promise<void>
}

/** 10 회원가입 */
export function SignupPage({ onSignup }: SignupPageProps) {
  const [values, setValues] = useState<Values>({ name: '', email: '', password: '', passwordConfirm: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  const change = (key: keyof Values) => (e: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }))
    // 고치기 시작하면 그 칸의 오류는 지움
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await onSignup?.({ name: values.name.trim(), email: values.email.trim(), password: values.password })
    } finally {
      setSubmitting(false)
    }
  }

  const passwordOk = isValidPassword(values.password)

  return (
    <AuthLayout
      title="회원가입"
      subtitle="이 인스턴스에서 쓸 계정을 만드세요."
      submitLabel="계정 만들기"
      onSubmit={handleSubmit}
      submitting={submitting}
      footer={<AuthSwitch prompt="이미 계정이 있으신가요?" linkLabel="로그인" href="#/login" />}
    >
      <TextField
        label="이름"
        size="lg"
        name="name"
        autoComplete="name"
        placeholder="이름을 입력하세요"
        value={values.name}
        error={errors.name}
        onChange={change('name')}
      />
      <TextField
        label="이메일"
        size="lg"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="이메일을 입력하세요"
        value={values.email}
        error={errors.email}
        onChange={change('email')}
      />
      <TextField
        label="비밀번호"
        size="lg"
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder="비밀번호를 입력하세요"
        value={values.password}
        error={errors.password}
        hint={PASSWORD_RULE}
        hintTone={passwordOk ? 'success' : 'neutral'}
        onChange={change('password')}
      />
      <TextField
        label="비밀번호 확인"
        size="lg"
        type="password"
        name="passwordConfirm"
        autoComplete="new-password"
        placeholder="비밀번호를 다시 입력하세요"
        value={values.passwordConfirm}
        error={errors.passwordConfirm}
        onChange={change('passwordConfirm')}
      />
    </AuthLayout>
  )
}
