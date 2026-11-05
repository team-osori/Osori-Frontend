import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import { Icon } from '../Icon/Icon'
import styles from './TextField.module.css'

type FieldSize = 'md' | 'lg'

/** 라벨 + 컨트롤 묶음. 직접 만든 컨트롤을 넣을 때도 사용합니다. */
export function Field({
  label,
  htmlFor,
  size = 'md',
  children,
}: {
  label: string
  htmlFor?: string
  size?: FieldSize
  children: ReactNode
}) {
  return (
    <div className={styles.field}>
      <label className={cx(styles.label, size === 'lg' && styles.labelLg)} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

type MessageProps = {
  /** 입력값이 잘못됐을 때 보여줄 문구. 있으면 빨간 테두리 */
  error?: string
  /** 입력창 아래 안내 문구 */
  hint?: string
  /** success면 초록색 체크와 함께 표시 */
  hintTone?: 'neutral' | 'success'
}

/** 입력창 아래 오류·안내 문구 */
function FieldMessage({ id, error, hint, hintTone = 'neutral' }: MessageProps & { id: string }) {
  if (error) {
    return (
      <p id={id} role="alert" className={cx(styles.message, styles.error)}>
        {error}
      </p>
    )
  }
  if (!hint) return null
  const success = hintTone === 'success'
  return (
    <p id={id} className={cx(styles.message, styles.hint, success && styles.hintSuccess)}>
      {success && <Icon name="checkSuccess" />}
      {hint}
    </p>
  )
}

/** input 기본 속성 size(글자 수)는 쓰지 않고, 같은 이름으로 화면 크기를 받습니다. */
type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> &
  MessageProps & {
    label: string
    /** lg는 로그인·회원가입처럼 입력창이 큰 화면용 (48px) */
    size?: FieldSize
    /** 입력값 앞에 고정으로 붙는 글자 (예: Authorization: Bearer) */
    prefix?: string
    /** 코드·경로 입력용 고정폭 글꼴 */
    mono?: boolean
  }

export function TextField({
  label,
  size = 'md',
  error,
  hint,
  hintTone,
  prefix,
  mono,
  className,
  id,
  'aria-describedby': describedBy,
  ...rest
}: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const messageId = `${inputId}-message`
  const hasMessage = Boolean(error || hint)
  const controlClass = cx(
    styles.control,
    styles.input,
    size === 'lg' && styles.inputLg,
    error && styles.invalid,
    className,
  )
  const a11y = {
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': cx(describedBy, hasMessage && messageId) || undefined,
  }
  const message = <FieldMessage id={messageId} error={error} hint={hint} hintTone={hintTone} />

  if (prefix) {
    return (
      <Field label={label} htmlFor={inputId} size={size}>
        <div className={cx(controlClass, styles.withPrefix)}>
          <span className={styles.prefix} aria-hidden>
            {prefix}
          </span>
          <input
            id={inputId}
            className={cx(styles.bare, mono && styles.mono)}
            aria-label={`${label} (${prefix})`}
            {...a11y}
            {...rest}
          />
        </div>
        {message}
      </Field>
    )
  }

  return (
    <Field label={label} htmlFor={inputId} size={size}>
      <input id={inputId} className={cx(controlClass, mono && styles.mono)} {...a11y} {...rest} />
      {message}
    </Field>
  )
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }

export function TextArea({ label, className, id, ...rest }: TextAreaProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <Field label={label} htmlFor={inputId}>
      <textarea id={inputId} className={cx(styles.control, styles.textarea, className)} {...rest} />
    </Field>
  )
}
