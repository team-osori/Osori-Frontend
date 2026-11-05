import type { SelectHTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import styles from './Select.module.css'

export type SelectOption = { value: string; label: string }

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  options: SelectOption[]
  size?: 'md' | 'sm'
}

export function Select({ options, size = 'md', className, ...rest }: SelectProps) {
  return (
    <select className={cx(styles.select, styles[size], className)} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
