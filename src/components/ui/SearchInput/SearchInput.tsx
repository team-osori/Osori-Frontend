import type { InputHTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import { Icon } from '../Icon/Icon'
import styles from './SearchInput.module.css'

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** md 40px(사이드바) · sm 36px(목록 상단) */
  size?: 'md' | 'sm'
  /** inset: 카드·팝오버 안에 들어가는 한 단계 어두운 입력창 (작은 아이콘 · 13px) */
  tone?: 'default' | 'inset'
}

export function SearchInput({ placeholder = '검색', size = 'md', tone = 'default', className, ...rest }: SearchInputProps) {
  return (
    <label className={cx(styles.wrap, size === 'sm' && styles.sm, tone === 'inset' && styles.inset, className)}>
      <Icon name={size === 'sm' || tone === 'inset' ? 'searchSm' : 'search'} />
      <input type="search" className={styles.input} placeholder={placeholder} aria-label={placeholder} {...rest} />
    </label>
  )
}
