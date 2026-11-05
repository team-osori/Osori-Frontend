import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import type { IconName } from '../../../assets/icons'
import { Icon } from '../Icon/Icon'
import styles from './Button.module.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  /** lg는 로그인·회원가입처럼 큰 입력창과 함께 쓰는 48px 버튼 */
  size?: 'lg' | 'md' | 'sm'
  icon?: IconName
  /** 아이콘을 글자 앞(start) 또는 뒤(end)에 놓음 */
  iconPosition?: 'start' | 'end'
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cx(styles.button, styles[variant], styles[size], className)} {...rest}>
      {icon && iconPosition === 'start' && <Icon name={icon} />}
      {children}
      {icon && iconPosition === 'end' && <Icon name={icon} />}
    </button>
  )
}
