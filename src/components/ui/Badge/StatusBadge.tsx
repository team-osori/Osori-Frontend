import type { ReactNode } from 'react'
import { cx } from '../../../lib/cx'
import styles from './StatusBadge.module.css'

export type StatusTone = 'success' | 'warning' | 'neutral' | 'danger'

export function StatusDot({ tone, size = 7 }: { tone: StatusTone; size?: number }) {
  return <span className={cx(styles.dot, styles[tone])} style={{ width: size, height: size }} />
}

export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span className={styles.badge}>
      <StatusDot tone={tone} />
      {children}
    </span>
  )
}
