import { useRef, type KeyboardEvent } from 'react'
import type { IconName } from '../../../assets/icons'
import { cx } from '../../../lib/cx'
import { Icon } from '../Icon/Icon'
import styles from './FilterChips.module.css'

type FilterItem<T extends string> = {
  value: T
  label: string
  /** 글자 앞 아이콘. 선택됐을 때 쓸 아이콘을 따로 줄 수 있음 */
  icon?: IconName
  activeIcon?: IconName
  /** 글자 뒤 개수 */
  count?: number
}

type FilterChipsProps<T extends string> = {
  items: Array<FilterItem<T>>
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  /** md 32px · lg 36px(아이콘 · 개수가 있는 필터) */
  size?: 'md' | 'lg'
}

/** 하나만 고르는 필터 칩 묶음 (←→ 키로 이동) */
export function FilterChips<T extends string>({ items, value, onChange, ariaLabel, size = 'md' }: FilterChipsProps<T>) {
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
            className={cx(styles.chip, size === 'lg' && styles.lg, selected && styles.active)}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {item.icon && <Icon name={selected && item.activeIcon ? item.activeIcon : item.icon} />}
            {item.label}
            {item.count != null && <span className={styles.count}>{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
