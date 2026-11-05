import styles from './ProgressBar.module.css'

/** value: 0~100. null이면 빈 트랙만 표시합니다. */
export function ProgressBar({ value, label }: { value: number | null; label?: string }) {
  const clamped = value == null ? 0 : Math.min(100, Math.max(0, value))
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value == null ? undefined : clamped}
    >
      {value != null && <div className={styles.fill} style={{ width: `${clamped}%` }} />}
    </div>
  )
}
