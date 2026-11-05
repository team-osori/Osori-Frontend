import { useRef, type KeyboardEvent } from 'react'
import { cx } from '../../../lib/cx'
import styles from './FilterChips.module.css'

type FilterChipsProps<T extends string> = {
  items: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/** 하나만 고르는 필터 칩 묶음 (←→ 키로 이동) */
export function FilterChips<T extends string>({ items, value, onChange, ariaLabel }: FilterChipsProps<T>) {
  const ref = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = items.length - 1
    const next = e.key === 'ArrowRight' ? (index === last ? 0 : index + 1) : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1) : null
    if (next == null) return
    e.preventDefault()
    onChange(items[next].value)
    ref.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }

  return (
    <div ref={ref} role="radiogroup" aria-label={ariaLabel} className={styles.group}>
      {items.map((item, index) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={cx(styles.chip, selected && styles.active)}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
