import type { ReactNode } from 'react'
import { StatusDot, type StatusTone } from '../../ui'
import styles from './ActionBar.module.css'

export type ActionBarStatus = { tone: StatusTone; label: string }

type ActionBarProps = {
  /** 왼쪽 상태 표시. 여러 개면 나란히 (예: 승인 61 · 삭제 3 · 미검토 3) */
  status?: ActionBarStatus | ActionBarStatus[]
  /** 점 없이 문장으로 보여줄 때 (예: 사람 판정 대기 18건 · 갈림 8). status 대신 사용 */
  summary?: ReactNode
  /** 버튼 왼쪽 안내 문구 (예: 확정 조건) */
  hint?: string
  children: ReactNode
}

/** 화면 하단 고정 바. AppLayout의 footer로 넣어 사용 */
export function ActionBar({ status, summary, hint, children }: ActionBarProps) {
  const items = status ? (Array.isArray(status) ? status : [status]) : []
  return (
    <div className={styles.bar}>
      <div className={styles.statusGroup} role="status">
        {items.map((item) => (
          <span key={item.label} className={styles.status}>
            <StatusDot tone={item.tone} size={8} />
            {item.label}
          </span>
        ))}
        {summary && <span className={styles.summary}>{summary}</span>}
      </div>
      <div className={styles.actions}>
        {hint && <span className={styles.hint}>{hint}</span>}
        {children}
      </div>
    </div>
  )
}
