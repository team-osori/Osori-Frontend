import { cx } from '../../../lib/cx'
import styles from './ProgressBar.module.css'

type ProgressBarProps = {
  /** 0~100. null이면 빈 트랙만 표시 */
  value: number | null
  label?: string
  /** sm 6px(카드 점수) · md 8px(실행 진행률) */
  size?: 'sm' | 'md'
  tone?: 'primary' | 'muted'
}

export function ProgressBar({ value, label, size = 'sm', tone = 'primary' }: ProgressBarProps) {
  const clamped = value == null ? 0 : Math.min(100, Math.max(0, value))
  return (
    <div
      className={cx(styles.track, size === 'md' && styles.md, tone === 'muted' && styles.muted)}
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
