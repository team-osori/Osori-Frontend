import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import type { IconName } from '../../../assets/icons'
import { Icon } from '../../ui'
import styles from './NavItem.module.css'

/** 상태 점 색 */
export type NavDot = 'all' | 'running' | 'done' | 'setup'

type NavItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon?: IconName
  /** 아이콘 대신 앞에 붙는 작은 상태 점 */
  dot?: NavDot
  count?: number
  active?: boolean
}

/** 보조 패널의 목록 항목 (상태 필터 · 설정 메뉴) */
export function NavItem({ icon, dot, label, count, active, className, ...rest }: NavItemProps) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      className={cx(styles.item, active && styles.active, className)}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {dot && <span className={cx(styles.dot, styles[dot])} aria-hidden />}
      <span className={styles.label}>{label}</span>
      {count != null && <span className={styles.count}>{count}</span>}
    </button>
  )
}
