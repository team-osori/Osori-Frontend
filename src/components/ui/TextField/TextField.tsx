import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import styles from './TextField.module.css'

/** 라벨 + 컨트롤 묶음. 직접 만든 컨트롤을 넣을 때도 사용합니다. */
export function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  /** 입력값 앞에 고정으로 붙는 글자 (예: Authorization: Bearer) */
  prefix?: string
  /** 코드·경로 입력용 고정폭 글꼴 */
  mono?: boolean
  /** 되돌릴 수 없는 동작 확인용 빨간 테두리 */
  danger?: boolean
}

export function TextField({ label, prefix, mono, danger, className, id, ...rest }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  if (prefix) {
    return (
      <Field label={label} htmlFor={inputId}>
        <div className={cx(styles.control, styles.input, styles.withPrefix, className)}>
          <span className={styles.prefix} aria-hidden>
            {prefix}
          </span>
          <input
            id={inputId}
            className={cx(styles.bare, mono && styles.mono)}
            aria-label={`${label} (${prefix})`}
            {...rest}
          />
        </div>
      </Field>
    )
  }

  return (
    <Field label={label} htmlFor={inputId}>
      <input id={inputId} className={cx(styles.control, styles.input, mono && styles.mono, danger && styles.danger, className)} {...rest} />
    </Field>
  )
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  /** sm 72px (한두 줄) · md 88px */
  size?: 'sm' | 'md'
}

export function TextArea({ label, size = 'md', className, id, ...rest }: TextAreaProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <Field label={label} htmlFor={inputId}>
      <textarea id={inputId} className={cx(styles.control, styles.textarea, size === 'sm' && styles.textareaSm, className)} {...rest} />
    </Field>
  )
}
