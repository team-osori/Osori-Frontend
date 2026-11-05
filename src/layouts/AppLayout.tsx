import type { ReactNode } from 'react'
import styles from './AppLayout.module.css'

/** 사이드바 + 본문 레이아웃 (전체 프로젝트, 프로젝트 내부 화면 공용) */
export function AppLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.layout}>
      {sidebar}
      <main className={styles.main}>{children}</main>
    </div>
  )
}
