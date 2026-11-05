import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import type { IconName } from '../../../assets/icons'
import { Icon } from '../Icon/Icon'
import styles from './IconButton.module.css'

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName
  /** 아이콘만 있으므로 이름은 필수 */
  label: string
}

/** 32px 정사각 아이콘 버튼 (수정 · 삭제 등) */
export function IconButton({ icon, label, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} className={cx(styles.button, className)} aria-label={label} title={label} {...rest}>
      <Icon name={icon} />
    </button>
  )
}
