import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../../lib/cx'
import styles from './Card.module.css'

type Tone = 'default' | 'danger'
type CardProps = HTMLAttributes<HTMLElement> & { tone?: Tone; as?: 'section' | 'div' | 'article' }

export function Card({ tone = 'default', as: Tag = 'section', className, ...rest }: CardProps) {
  return <Tag className={cx(styles.card, tone === 'danger' && styles.danger, className)} {...rest} />
}

export function CardTitle({ tone = 'default', children }: { tone?: Tone; children: ReactNode }) {
  return <h2 className={cx(styles.title, tone === 'danger' && styles.dangerTitle)}>{children}</h2>
}
