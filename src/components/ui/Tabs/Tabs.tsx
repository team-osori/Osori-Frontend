import { useRef, type KeyboardEvent } from 'react'
import { cx } from '../../../lib/cx'
import styles from './Tabs.module.css'

type TabsProps<T extends string> = {
  items: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
}

/** 탭 목록. 선택된 탭만 Tab 키로 들어오고, ←→ Home End로 이동 (W3C tabs 패턴) */
export function Tabs<T extends string>({ items, value, onChange, ariaLabel }: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = items.length - 1
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next == null) return
    e.preventDefault()
    onChange(items[next].value)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div ref={listRef} role="tablist" aria-label={ariaLabel} className={styles.list}>
      {items.map((item, index) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={cx(styles.tab, selected && styles.active)}
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
