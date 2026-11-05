import { cx } from '../../../lib/cx'
import styles from './Tabs.module.css'

type TabsProps<T extends string> = {
  items: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
}

export function Tabs<T extends string>({ items, value, onChange, ariaLabel }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={styles.list}>
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cx(styles.tab, selected && styles.active)}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
