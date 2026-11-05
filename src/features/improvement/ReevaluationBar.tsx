import type { ReactNode } from 'react'
import styles from './improvement.module.css'

type ReevaluationBarProps = {
  /** 왼쪽 안내 문구 (예: v3과 v4를 같은 질문 세트로 비교합니다) */
  status: string
  children: ReactNode
}

/** 개선안 적용 화면 하단 고정 바. AppLayout의 footer로 넣어 사용 */
export function ReevaluationBar({ status, children }: ReevaluationBarProps) {
  return (
    <div className={styles.bar}>
      <span className={styles.barStatus} role="status">
        {status}
      </span>
      <div className={styles.barActions}>{children}</div>
    </div>
  )
}
