import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { TextField } from '../../components/ui'
import { checkLoginId, isValidLoginId, isValidName, isValidPassword, LOGIN_ID_RULE, PASSWORD_RULE } from '../../features/auth'
import { AuthLayout, AuthSwitch } from '../../layouts/AuthLayout'
import styles from './SignupPage.module.css'

type Values = { name: string; loginId: string; password: string; passwordConfirm: string }
/** 칸별 오류. form은 특정 칸과 상관없는 오류 (가입 버튼 위에 표시) */
export type SignupErrors = Partial<Record<keyof Values | 'form', string>>

/** 입력을 멈추고 이만큼 지나면 아이디 중복 확인 */
const CHECK_DELAY = 450

/** 아이디 중복 확인 상태 */
type IdCheck = { loginId: string; state: 'checking' | 'available' | 'taken' | 'failed' }

function validate({ name, loginId, password, passwordConfirm }: Values): SignupErrors {
  const errors: SignupErrors = {}
  if (!isValidName(name)) errors.name = '이름을 1~30자로 입력하세요.'
  if (!isValidLoginId(loginId.trim())) errors.loginId = `아이디는 ${LOGIN_ID_RULE}이어야 합니다.`
  if (!isValidPassword(password)) errors.password = `비밀번호는 ${PASSWORD_RULE}이어야 합니다.`
  if (password !== passwordConfirm) errors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  return errors
}

type SignupPageProps = {
  /** 입력값이 모두 올바를 때 호출됩니다. 서버에서 거절하면 칸별 오류를 돌려줍니다. */
  onSignup?: (values: Omit<Values, 'passwordConfirm'>) => SignupErrors | void | Promise<SignupErrors | void>
}

/** 10 회원가입 */
export function SignupPage({ onSignup }: SignupPageProps) {
  const [values, setValues] = useState<Values>({ name: '', loginId: '', password: '', passwordConfirm: '' })
  const [errors, setErrors] = useState<SignupErrors>({})
  const [idCheck, setIdCheck] = useState<IdCheck>()
  const [submitting, setSubmitting] = useState(false)
  const checkAbort = useRef<AbortController>(null)

  const change = (key: keyof Values) => (e: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }))
    // 고치기 시작하면 그 칸의 오류는 지움
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }))
    if (key === 'loginId') {
      checkAbort.current?.abort()
      setIdCheck(undefined)
    }
  }

  /** 아이디 중복 확인. 쓸 수 있으면 true */
  async function verifyLoginId(loginId: string): Promise<boolean> {
    if (idCheck?.loginId === loginId && idCheck.state === 'available') return true
    checkAbort.current?.abort()
    const controller = new AbortController()
    checkAbort.current = controller
    setIdCheck({ loginId, state: 'checking' })
    try {
      const available = await checkLoginId(loginId, controller.signal)
      setIdCheck({ loginId, state: available ? 'available' : 'taken' })
      if (!available) setErrors((prev) => ({ ...prev, loginId: '이미 사용 중인 아이디입니다.' }))
      return available
    } catch {
      if (controller.signal.aborted) return false
      // 확인에 실패해도 가입은 시도하고, 중복이면 서버가 다시 알려줌
      setIdCheck({ loginId, state: 'failed' })
      return true
    }
  }

  // 아이디 입력을 멈추면 바로 중복 확인 (칸을 벗어날 때까지 기다리지 않음)
  useEffect(() => {
    const loginId = values.loginId.trim()
    if (!isValidLoginId(loginId)) return
    const timer = window.setTimeout(() => void verifyLoginId(loginId), CHECK_DELAY)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.loginId])

  function onLoginIdBlur() {
    const loginId = values.loginId.trim()
    if (isValidLoginId(loginId) && idCheck?.loginId !== loginId) void verifyLoginId(loginId)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      const loginId = values.loginId.trim()
      if (!(await verifyLoginId(loginId))) return
      const serverErrors = await onSignup?.({ name: values.name.trim(), loginId, password: values.password })
      if (serverErrors) setErrors(serverErrors)
    } finally {
      setSubmitting(false)
    }
  }

  const passwordOk = isValidPassword(values.password)
  const idHint =
    idCheck?.state === 'checking'
      ? '사용할 수 있는지 확인하는 중…'
      : idCheck?.state === 'available'
        ? '사용할 수 있는 아이디입니다.'
        : idCheck?.state === 'failed'
          ? '지금은 중복 여부를 확인하지 못했어요. 가입할 때 다시 확인합니다.'
          : LOGIN_ID_RULE

  return (
    <AuthLayout
      title="회원가입"
      subtitle="이 인스턴스에서 쓸 계정을 만드세요."
      submitLabel={submitting ? '계정 만드는 중…' : '계정 만들기'}
      footer={<AuthSwitch prompt="이미 계정이 있으신가요?" linkLabel="로그인" href="#/login" />}
      onSubmit={handleSubmit}
      submitting={submitting}
    >
      <TextField
        label="이름"
        size="md"
        name="name"
        autoComplete="name"
        placeholder="이름을 입력하세요"
        value={values.name}
        error={errors.name}
        onChange={change('name')}
      />
      <TextField
        label="아이디"
        size="md"
        name="loginId"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="아이디를 입력하세요"
        value={values.loginId}
        error={errors.loginId}
        hint={idHint}
        hintTone={idCheck?.state === 'available' ? 'success' : 'neutral'}
        onChange={change('loginId')}
        onBlur={onLoginIdBlur}
      />
      <TextField
        label="비밀번호"
        size="md"
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
        size="md"
        type="password"
        name="passwordConfirm"
        autoComplete="new-password"
        placeholder="비밀번호를 다시 입력하세요"
        value={values.passwordConfirm}
        error={errors.passwordConfirm}
        onChange={change('passwordConfirm')}
      />
      {errors.form && (
        <p className={styles.formError} role="alert">
          {errors.form}
        </p>
      )}
    </AuthLayout>
  )
}
