import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../../lib/cx'
import type { IconName } from '../../../assets/icons'
import { Icon } from '../../ui'
import { usePopover } from '../../ui/Select/usePopover'
import styles from './SidebarPopover.module.css'

/** 방향키로 이동할 항목 표시 (검색창 · 옵션 · 하단 동작) */
const ITEM = '[data-popover-item]'

type SidebarPopoverProps = {
  open: boolean
  onClose: () => void
  /** 팝오버를 연 버튼. 닫히면 이 버튼으로 포커스를 돌려줌 */
  triggerRef: RefObject<HTMLElement | null>
  /** 바깥 클릭 판정에서 제외할 영역 (보통 트리거를 감싼 요소) */
  rootRef: RefObject<HTMLElement | null>
  label: string
  /** 트리거와 팝오버 사이 간격 */
  gap?: number
  className?: string
  children: ReactNode
}

/**
 * 사이드바 프로젝트 카드에서 여는 팝오버 틀.
 * 열리면 첫 포커스 대상(data-autofocus, 없으면 첫 항목)으로 포커스를 옮기고,
 * ↑↓ 로 항목 이동, Esc로 닫고 트리거로 복귀, Tab을 누르면 닫습니다.
 */
export function SidebarPopover({ open, onClose, triggerRef, rootRef, label, gap, className, children }: SidebarPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const style = usePopover({ open, onClose, triggerRef, rootRef, popoverRef, gap, maxHeight: 480 })

  useEffect(() => {
    if (!open) return
    const root = popoverRef.current
    const first = root?.querySelector<HTMLElement>('[data-autofocus]') ?? root?.querySelector<HTMLElement>(ITEM)
    first?.focus()
  }, [open])

  if (!open) return null

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'Tab') {
      onClose()
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const items = Array.from(popoverRef.current?.querySelectorAll<HTMLElement>(ITEM) ?? [])
    if (items.length === 0) return
    e.preventDefault()
    const index = items.indexOf(document.activeElement as HTMLElement)
    const step = e.key === 'ArrowDown' ? 1 : -1
    const next = index === -1 ? (step === 1 ? 0 : items.length - 1) : (index + step + items.length) % items.length
    items[next].focus()
  }

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={label}
      className={cx(styles.popover, className)}
      style={style}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>,
    document.body,
  )
}

type PopoverOptionProps = {
  selected: boolean
  onSelect: () => void
  children: ReactNode
}

/** 선택 항목 한 줄. 선택된 항목은 배경과 체크 표시 */
export function PopoverOption({ selected, onSelect, children }: PopoverOptionProps) {
  return (
    <li
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      data-popover-item
      data-autofocus={selected || undefined}
      className={cx(styles.option, selected && styles.selected)}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <span className={styles.optionBody}>{children}</span>
      {selected && <Icon name="checkAccent" className={styles.check} />}
    </li>
  )
}

/** 옵션 목록 */
export function PopoverList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul role="listbox" aria-label={label} className={styles.list}>
      {children}
    </ul>
  )
}

/** 구분선 아래의 동작 버튼 (새로 만들기 · 전체 보기) */
export function PopoverAction({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button type="button" data-popover-item className={styles.action} onClick={onClick}>
      <Icon name={icon} />
      {label}
    </button>
  )
}

export function PopoverActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}
