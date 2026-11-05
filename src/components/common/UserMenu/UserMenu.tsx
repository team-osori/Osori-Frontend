import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Avatar, Divider, Icon } from '../../ui'
import styles from './UserMenu.module.css'

/** 계정 버튼 위로 띄우는 간격 */
const GAP_ABOVE = 10

export type UserMenuActions = {
  /** 예전 메뉴 호환용 (지금은 메뉴에 표시하지 않음) */
  instanceVersion?: string
  /** 예전 메뉴 호환용 (지금은 메뉴에 표시하지 않음) */
  onAccountSettings?: () => void
  onLogout?: () => void
}

type UserMenuProps = UserMenuActions & { name: string; email: string }

/** 사이드바 맨 아래 계정 버튼. 누르면 이름 · 아이디와 로그아웃 메뉴가 위로 열립니다. */
export function UserMenu({ name, email, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<CSSProperties>()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()

  // 스크롤되는 사이드바 안에서도 잘리지 않도록 body에 띄우고, 위치는 화면 기준으로 계산
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      setPosition({
        left: Math.max(8, rect.left),
        bottom: window.innerHeight - rect.top + GAP_ABOVE,
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    // 열리면 첫 항목으로 포커스 이동
    popoverRef.current?.querySelector<HTMLElement>('button')?.focus()

    const close = (restoreFocus: boolean) => {
      setOpen(false)
      if (restoreFocus) triggerRef.current?.focus()
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!popoverRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true)
    }
    // 메뉴 밖으로 Tab 이동하면 닫기
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as Node
      if (!popoverRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [open])

  const choose = (action?: () => void) => {
    setOpen(false)
    action?.()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-label={`${name} 계정 메뉴`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
      >
        <span className={styles.avatar} aria-hidden>
          {name.slice(0, 1)}
        </span>
        <span className={styles.who}>
          <b>{name}</b>
        </span>
        <Icon name="chevronUpDown" />
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label="계정 메뉴"
            className={styles.popover}
            style={position}
          >
            <div className={styles.header}>
              <Avatar name={name} raised />
              <div className={styles.identity}>
                <span className={styles.name}>{name}</span>
                <span className={styles.email}>{email}</span>
              </div>
            </div>

            <div className={styles.divider}>
              <Divider />
            </div>

            <div className={styles.list}>
              <button type="button" className={`${styles.item} ${styles.danger}`} onClick={() => choose(onLogout)}>
                <Icon name="logout" />
                로그아웃
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
