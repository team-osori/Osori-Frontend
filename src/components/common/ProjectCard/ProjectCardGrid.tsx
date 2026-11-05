import type { ReactNode } from 'react'
import styles from './ProjectCard.module.css'

/** 프로젝트 카드 그리드. 폭에 따라 3열 → 2열 → 1열로 자동 전환 */
export function ProjectCardGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>
}
