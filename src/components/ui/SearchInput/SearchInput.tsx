import type { InputHTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import { Icon } from '../Icon/Icon'
import styles from './SearchInput.module.css'

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** md 40px(사이드바) · sm 36px(목록 상단) */
  size?: 'md' | 'sm'
}

export function SearchInput({ placeholder = '검색', size = 'md', className, ...rest }: SearchInputProps) {
  return (
    <label className={cx(styles.wrap, size === 'sm' && styles.sm, className)}>
      <Icon name={size === 'sm' ? 'searchSm' : 'search'} />
      <input type="search" className={styles.input} placeholder={placeholder} aria-label={placeholder} {...rest} />
    </label>
  )
}
