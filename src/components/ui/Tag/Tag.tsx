import type { ReactNode } from 'react'
import styles from './Tag.module.css'

/** 버전 등 짧은 값을 표시하는 알약형 태그 (예: v1) */
export function Tag({ children }: { children: ReactNode }) {
  return <span className={styles.tag}>{children}</span>
}
