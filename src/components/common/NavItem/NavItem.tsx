import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import type { IconName } from '../../../assets/icons'
import { Icon } from '../../ui'
import styles from './NavItem.module.css'

type NavItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName
  label: string
  count?: number
  active?: boolean
  /** md: 홈 사이드바(49px), sm: 프로젝트 사이드바(46px, 활성 시 굵게) */
  size?: 'md' | 'sm'
}

export function NavItem({ icon, label, count, active, size = 'md', className, ...rest }: NavItemProps) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      className={cx(styles.item, styles[size], active && styles.active, className)}
      {...rest}
    >
      <Icon name={icon} />
      <span className={styles.label}>{label}</span>
      {count != null && <span className={styles.count}>{count}</span>}
    </button>
  )
}
