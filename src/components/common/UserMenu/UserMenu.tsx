import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Avatar, Divider, Icon } from '../../ui'
import { UserProfile } from '../UserProfile/UserProfile'
import styles from './UserMenu.module.css'

/** 프로필 버튼 위쪽으로 띄우는 간격과, 사이드바 안쪽 여백만큼 왼쪽으로 당기는 값 (Figma 기준) */
const GAP_ABOVE = 20
const OFFSET_LEFT = 12

export type UserMenuActions = {
  /** 인스턴스 버전 표시 (예: v1.4.2) */
  instanceVersion: string
  onAccountSettings?: () => void
  onLogout?: () => void
}

type UserMenuProps = UserMenuActions & { name: string; role: string; email: string }

/** 사이드바 하단 프로필. 누르면 계정 설정 · 인스턴스 정보 · 로그아웃 메뉴가 위로 열립니다. */
export function UserMenu({ name, role, email, instanceVersion, onAccountSettings, onLogout }: UserMenuProps) {
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
        left: Math.max(8, rect.left - OFFSET_LEFT),
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
      <UserProfile
        name={name}
        role={role}
        buttonRef={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
      />

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
              <button type="button" className={styles.item} onClick={() => choose(onAccountSettings)}>
                <Icon name="settingsSm" />
                계정 설정
              </button>
              <div className={styles.info}>
                <Icon name="server" />
                <span className={styles.infoLabel}>인스턴스 정보</span>
                <span className={styles.version}>{instanceVersion}</span>
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
