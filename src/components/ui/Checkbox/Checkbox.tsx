import { cx } from '../../../lib/cx'
import styles from './Checkbox.module.css'

/** 접근성 이름: 보이는 label 또는 ariaLabel 중 하나는 필수 */
type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
} & ({ label: string; ariaLabel?: never } | { label?: never; ariaLabel: string })

/** 평가 단계 완료 표시(✓)와 같은 톤의 체크박스 */
export function Checkbox({ checked, onChange, label, ariaLabel, disabled }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
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
