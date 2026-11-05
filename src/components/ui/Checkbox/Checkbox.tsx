import { cx } from '../../../lib/cx'
import styles from './Checkbox.module.css'

type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

/** 평가 단계 완료 표시(✓)와 같은 톤의 체크박스 */
export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      className={cx(styles.root, checked && styles.checked)}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.box} aria-hidden>
        {checked && '✓'}
      </span>
      {label}
    </button>
  )
}
