import type { InputHTMLAttributes } from 'react'
import { Icon } from '../Icon/Icon'
import styles from './SearchInput.module.css'

export function SearchInput({ placeholder = '검색', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={styles.wrap}>
      <Icon name="search" />
      <input type="search" className={styles.input} placeholder={placeholder} aria-label={placeholder} {...rest} />
    </label>
  )
}
