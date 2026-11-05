import type { ReactNode } from 'react'
import { cx } from '../../../lib/cx'
import styles from './Tag.module.css'

type TagProps = {
  children: ReactNode
  /** primary: 비교 대상 버전 강조 */
  tone?: 'default' | 'primary'
  /** 버전 표시는 굵게, 유형 라벨은 보통 굵기 */
  strong?: boolean
}

/** 알약형 태그 (버전 v1, 질문 유형 등) */
export function Tag({ children, tone = 'default', strong = true }: TagProps) {
  return <span className={cx(styles.tag, strong && styles.strong, tone === 'primary' && styles.primary)}>{children}</span>
}
