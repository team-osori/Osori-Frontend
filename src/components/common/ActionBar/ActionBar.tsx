import type { ReactNode } from 'react'
import { StatusDot, type StatusTone } from '../../ui'
import styles from './ActionBar.module.css'

type ActionBarProps = {
  status: string
  tone?: StatusTone
  children: ReactNode
}

/** 화면 하단 고정 바. AppLayout의 footer로 넣어 사용 */
export function ActionBar({ status, tone = 'success', children }: ActionBarProps) {
  return (
    <div className={styles.bar}>
      <span className={styles.status} role="status">
        <StatusDot tone={tone} size={8} />
        {status}
      </span>
      <div className={styles.actions}>{children}</div>
    </div>
  )
}
