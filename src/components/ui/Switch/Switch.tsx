import { cx } from '../../../lib/cx'
import styles from './Switch.module.css'

/** 접근성 이름: 보이는 label 또는 ariaLabel 중 하나는 필수 */
type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
} & ({ label: string; ariaLabel?: never } | { label?: never; ariaLabel: string })

/** 켜기/끄기 토글 */
export function Switch({ checked, onChange, label, ariaLabel, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cx(styles.root, checked && styles.on)}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.track} aria-hidden>
        <span className={styles.thumb} />
      </span>
      {label}
    </button>
  )
}
