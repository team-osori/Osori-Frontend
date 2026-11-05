import type { ReactNode } from 'react'
import { cx } from '../../../lib/cx'
import styles from './StatusBadge.module.css'

/** success 완료 · warning 평가 중 · neutral 설정 필요 · danger 실패/삭제 · primary 진행 중 · muted 대기 · caution 불안정 · accent 합의 샘플 */
export type StatusTone = 'success' | 'warning' | 'neutral' | 'danger' | 'primary' | 'muted' | 'caution' | 'accent'

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
