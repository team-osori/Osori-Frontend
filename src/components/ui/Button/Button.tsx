import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import type { IconName } from '../../../assets/icons'
import { Icon } from '../Icon/Icon'
import styles from './Button.module.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** primary 핑크 · secondary 표면색 · tonal 한 단계 밝은 표면색 · success 연한 초록 · danger 빨간 테두리 */
  variant?: 'primary' | 'secondary' | 'tonal' | 'success' | 'danger'
  /** md 44px · sm 40px · xs 34px · xxs 32px(표 안 버튼) */
  size?: 'md' | 'sm' | 'xs' | 'xxs'
  icon?: IconName
  /** 글자 뒤에 붙는 아이콘 (예: 다음 단계 →) */
  iconEnd?: IconName
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  fullWidth,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], styles[size], fullWidth && styles.full, className)}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
      {iconEnd && <Icon name={iconEnd} />}
    </button>
  )
}
