import { cx } from '../../../lib/cx'
import styles from './Switch.module.css'

type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

/** 켜기/끄기 토글 */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
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
