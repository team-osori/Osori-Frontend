import type { ReactNode } from 'react'
import type { IconName } from '../../../assets/icons'
import { Icon } from '../../ui'
import styles from './EmptyState.module.css'

type EmptyStateProps = {
  icon: IconName
  title: string
  description?: string
  /** 안내 아래에 놓일 동작 (보통 Button) */
  action?: ReactNode
}

/** 목록이 비어 있을 때 보여주는 안내 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.root}>
      <div className={styles.iconBox}>
        <Icon name={icon} />
      </div>
      <div className={styles.texts}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action}
    </div>
  )
}
