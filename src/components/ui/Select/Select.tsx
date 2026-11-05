import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
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
  /** value가 옵션에 없을 때 표시 */
  placeholder?: string
  id?: string
  ariaLabel?: string
  className?: string
}

const LIST_GAP = 6

/** 브라우저 기본 select 대신 쓰는 커스텀 드롭다운 (키보드: ↑↓ Home End Enter Esc) */
export function Select({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth,
  align = 'start',
  placeholder = '선택',
  id,
  ariaLabel,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [listStyle, setListStyle] = useState<CSSProperties>()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  // 목록은 body에 portal로 띄움: 스크롤 영역·transform(드로어) 안에서도 잘리거나 어긋나지 않게
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const below = window.innerHeight - rect.bottom - LIST_GAP - 8
      const above = rect.top - LIST_GAP - 8
      const openUp = below < 160 && above > below
      setListStyle({
        position: 'fixed',
        minWidth: rect.width,
        maxHeight: Math.min(240, openUp ? above : below),
        ...(openUp ? { bottom: window.innerHeight - rect.top + LIST_GAP } : { top: rect.bottom + LIST_GAP }),
        ...(align === 'end' ? { right: window.innerWidth - rect.right } : { left: rect.left }),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, align])

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!rootRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

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
      className={cx(styles.root, styles[size], fullWidth && styles.full, open && styles.open, className)}
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
        <Icon name="chevronDown" className={styles.chevron} />
      </button>

      {open &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className={cx(styles.list, size === 'sm' && styles.listSm)}
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
