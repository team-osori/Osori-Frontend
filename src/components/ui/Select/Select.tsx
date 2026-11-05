import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { cx } from '../../../lib/cx'
import { Icon } from '../Icon/Icon'
import styles from './Select.module.css'

export type SelectOption = { value: string; label: string }

type SelectProps = {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  size?: 'md' | 'sm'
  /** 부모 폭을 꽉 채움 */
  fullWidth?: boolean
  /** 목록을 오른쪽 끝에 맞춰 엶 */
  align?: 'start' | 'end'
  id?: string
  ariaLabel?: string
  className?: string
}

/** 브라우저 기본 select 대신 쓰는 커스텀 드롭다운 (키보드: ↑↓ Home End Enter Esc) */
export function Select({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth,
  align = 'start',
  id,
  ariaLabel,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value))
  const selected = options[selectedIndex]

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const openList = () => {
    setHighlight(selectedIndex)
    setOpen(true)
  }

  const choose = (index: number) => {
    const option = options[index]
    if (option) onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlight((i) => Math.min(options.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlight((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setHighlight(0)
        break
      case 'End':
        e.preventDefault()
        setHighlight(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(highlight)
        break
      case 'Escape':
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div
      ref={rootRef}
      className={cx(
        styles.root,
        styles[size],
        fullWidth && styles.full,
        open && styles.open,
        align === 'end' && styles.alignEnd,
        className,
      )}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-activedescendant={open ? `${listId}-${highlight}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={styles.value}>{selected?.label}</span>
        <Icon name="chevronDown" className={styles.chevron} />
      </button>

      {open && (
        <ul id={listId} role="listbox" className={styles.list}>
          {options.map((option, index) => {
            const isSelected = index === selectedIndex
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                className={cx(styles.option, index === highlight && styles.highlighted, isSelected && styles.selected)}
                onPointerEnter={() => setHighlight(index)}
                onClick={() => choose(index)}
              >
                {option.label}
                {isSelected && <span className={styles.check} aria-hidden />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
