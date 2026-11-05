import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../../lib/cx'
import styles from './Card.module.css'

type Tone = 'default' | 'danger'
type CardProps = HTMLAttributes<HTMLElement> & { tone?: Tone; as?: 'section' | 'div' | 'article' }

export function Card({ tone = 'default', as: Tag = 'section', className, ...rest }: CardProps) {
  return <Tag className={cx(styles.card, tone === 'danger' && styles.danger, className)} {...rest} />
}

/** 카드 제목 줄: 왼쪽 제목, 오른쪽 부가 정보·버튼 (좁으면 줄바꿈) */
export function CardHeader({ title, tone, children }: { title: string; tone?: Tone; children?: ReactNode }) {
  return (
    <div className={styles.header}>
      <CardTitle tone={tone}>{title}</CardTitle>
      {children && <div className={styles.headerAside}>{children}</div>}
    </div>
  )
}

export function CardTitle({ tone = 'default', children }: { tone?: Tone; children: ReactNode }) {
  return <h2 className={cx(styles.title, tone === 'danger' && styles.dangerTitle)}>{children}</h2>
}
