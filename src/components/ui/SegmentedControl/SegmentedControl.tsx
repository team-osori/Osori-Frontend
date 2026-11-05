import { useRef, type KeyboardEvent } from 'react'
import { cx } from '../../../lib/cx'
import styles from './SegmentedControl.module.css'

type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<T | { value: T; label: string }>
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  id?: string
}

/** 한 줄로 붙은 선택지 중 하나 고르기 (←→ 키로 이동) */
export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel, id }: SegmentedControlProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = items.length - 1
    const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (index === last ? 0 : index + 1) : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (index === 0 ? last : index - 1) : null
    if (next == null) return
    e.preventDefault()
    onChange(items[next].value)
    ref.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }

  return (
    <div ref={ref} id={id} role="radiogroup" aria-label={ariaLabel} className={styles.group}>
      {items.map((item, index) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={cx(styles.item, selected && styles.active)}
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
