import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import styles from './Modal.module.css'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * 화면 가운데에 뜨는 대화상자.
 * - Esc · 배경 클릭 · 닫기 버튼으로 닫힘
 * - 열리면 `data-autofocus`가 붙은 요소(없으면 첫 입력 요소)로 포커스가 이동하고, Tab이 모달 밖으로 나가지 않음
 * - 닫히면 열기 전에 포커스가 있던 요소로 돌아감
 * - 열려 있는 동안 배경 스크롤 잠금
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  // 최신 onClose를 쓰되, 부모가 다시 그려져도 아래 effect가 다시 실행되지 않게
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const initial =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ??
      panel?.querySelector<HTMLElement>('input, textarea, select') ??
      panel?.querySelector<HTMLElement>(FOCUSABLE)
    initial?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      // 안쪽 컴포넌트(Select 등)가 이미 Esc를 처리했으면 모달은 유지
      if (e.key === 'Escape' && !e.defaultPrevented) onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      opener?.focus()
    }
  }, [open])

  if (!open) return null

  // Tab · Shift+Tab이 모달 안에서만 돌게 함
  const trapFocus = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.panel}
        onKeyDown={trapFocus}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** 모달 본문 */
export function ModalBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>
}

/** 모달 하단 버튼 영역 (위쪽 구분선 포함) */
export function ModalFooter({ children }: { children: ReactNode }) {
  return <footer className={styles.footer}>{children}</footer>
}
