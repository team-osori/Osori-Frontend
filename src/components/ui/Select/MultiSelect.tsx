import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../../lib/cx'
import type { IconName } from '../../../assets/icons'
import { Icon } from '../Icon/Icon'
import type { SelectOption } from './Select'
import { usePopover } from './usePopover'
import styles from './Select.module.css'

type MultiSelectProps = {
  options: SelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  /** 트리거 앞 아이콘 */
  icon?: IconName
  /** 선택 요약 문구. 기본: "첫 항목 외 N개" */
  summary?: (selected: SelectOption[]) => string
  placeholder?: string
  ariaLabel: string
}

const defaultSummary = (selected: SelectOption[]) =>
  selected.length > 1 ? `${selected[0].label} 외 ${selected.length - 1}개` : selected[0]?.label ?? ''

/** 여러 개를 고르는 커스텀 드롭다운 (Space/Enter로 선택 토글, Esc로 닫기) */
export function MultiSelect({
  options,
  value,
  onChange,
  icon,
  summary = defaultSummary,
  placeholder = '선택',
  ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const close = useCallback(() => setOpen(false), [])
  const listStyle = usePopover({ open, onClose: close, triggerRef, rootRef, popoverRef: listRef })

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector(`[data-index="${highlight}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, highlight])

  const selected = options.filter((o) => value.includes(o.value))

  const toggle = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(value.includes(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value])
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        setHighlight(0)
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(highlight)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={cx(styles.root, styles.field, open && styles.open)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-activedescendant={open ? `${listId}-${highlight}` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        {icon && <Icon name={icon} />}
        <span className={cx(styles.value, styles.grow, !selected.length && styles.placeholder)}>
          {selected.length ? summary(selected) : placeholder}
        </span>
        <Icon name="chevronDownSm" className={styles.chevron} />
      </button>

      {open &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-multiselectable
            aria-label={ariaLabel}
            className={styles.list}
            style={listStyle}
          >
            {options.map((option, index) => {
              const isSelected = value.includes(option.value)
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  className={cx(styles.option, styles.multiOption, index === highlight && styles.highlighted)}
                  onPointerEnter={() => setHighlight(index)}
                  onClick={() => toggle(index)}
                >
                  <span className={cx(styles.box, isSelected && styles.boxOn)} aria-hidden>
                    {isSelected && '✓'}
                  </span>
                  {option.label}
                </li>
              )
            })}
          </ul>,
          document.body,
        )}
    </div>
  )
}
