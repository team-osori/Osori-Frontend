import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

type PageHeaderProps = {
  title: string
  /** 제목 옆에 흐리게 붙는 개수 (예: 전체 프로젝트 3) */
  count?: number
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, count, description, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.titles}>
        <h1 className={styles.title}>
          {title}
          {count != null && <span className={styles.count}>{count}</span>}
        </h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
