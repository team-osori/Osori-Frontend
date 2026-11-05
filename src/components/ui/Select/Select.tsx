import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../../lib/cx'
import { Icon } from '../Icon/Icon'
import { usePopover } from './usePopover'
import styles from './Select.module.css'

export type SelectOption = { value: string; label: string }

type SelectProps = {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  /** md: 툴바용 40px · sm: 사이드바용 30px · field: 폼 입력과 같은 44px · row: 표 안에서 쓰는 34px */
  size?: 'md' | 'sm' | 'field' | 'row'
  /** 부모 폭을 꽉 채움 */
  fullWidth?: boolean
  /** 목록을 오른쪽 끝에 맞춰 엶 */
  align?: 'start' | 'end'
  /** 강조 테두리 (예: 비교 대상 버전) */
  accent?: boolean
  /** value가 옵션에 없을 때 표시 */
  placeholder?: string
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
  placeholder = '선택',
  accent,
  id,
  ariaLabel,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  // 목록은 body에 portal로 띄움: 스크롤 영역·transform(드로어) 안에서도 잘리거나 어긋나지 않게
  const close = useCallback(() => setOpen(false), [])
  const listStyle = usePopover({ open, onClose: close, triggerRef, rootRef, popoverRef: listRef, align })

  // 키보드로 하이라이트가 목록 밖에 있으면 보이게 스크롤
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector(`[data-index="${highlight}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, highlight])

  const openList = () => {
    setHighlight(Math.max(0, selectedIndex))
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
        e.preventDefault()
        setOpen(false)
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div
      ref={rootRef}
      className={cx(styles.root, styles[size], fullWidth && styles.full, open && styles.open, accent && styles.accent, className)}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-activedescendant={open ? `${listId}-${highlight}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={cx(styles.value, !selected && styles.placeholder)}>{selected?.label ?? placeholder}</span>
        <Icon name={size === 'row' ? 'chevronDownXs' : 'chevronDown'} className={styles.chevron} />
      </button>

      {open &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className={cx(styles.list, (size === 'sm' || size === 'row') && styles.listSm)}
            style={listStyle}
          >
            {options.map((option, index) => {
              const isSelected = index === selectedIndex
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  data-index={index}
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
          </ul>,
          document.body,
        )}
    </div>
  )
}
