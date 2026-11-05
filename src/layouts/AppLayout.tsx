import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { Icon } from '../components/ui'
import { BrandMark } from '../components/common/BrandMark/BrandMark'
import styles from './AppLayout.module.css'

/** 레이아웃 폭이 이 값 미만이면 사이드바를 드로어로 띄움 */
const DRAWER_BREAKPOINT = 1024

type AppLayoutProps = {
  sidebar: ReactNode
  children: ReactNode
  /** 본문 하단에 붙어 따라다니는 영역 (예: ActionBar) */
  footer?: ReactNode
  /** 화면 전체가 아니라 부모 박스 크기에 맞출 때 */
  contained?: boolean
  /** 본문 바깥 여백을 없애 자식이 본문 영역을 가득 채움 (예: 대기열 + 상세 2단 화면) */
  flush?: boolean
}

/** 사이드바(레일 + 패널) + 본문 레이아웃. 좁은 화면에서는 사이드바가 드로어로 열립니다. */
export function AppLayout({ sidebar, children, footer, contained, flush }: AppLayoutProps) {
  const ref = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  const [narrow, setNarrow] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 뷰포트가 아니라 레이아웃 자체 폭 기준. 첫 페인트 전에 측정해 깜빡임 방지
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = (width: number) => {
      const isNarrow = width < DRAWER_BREAKPOINT
      setNarrow(isNarrow)
      if (!isNarrow) setDrawerOpen(false)
    }
    update(el.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 닫은 뒤 본문의 inert가 풀린 다음 메뉴 버튼으로 포커스 복귀
  const restoreFocusRef = useRef(false)
  const closeDrawer = () => {
    restoreFocusRef.current = true
    setDrawerOpen(false)
  }
  useEffect(() => {
    if (drawerOpen || !restoreFocusRef.current) return
    restoreFocusRef.current = false
    menuRef.current?.focus()
  }, [drawerOpen])

  // 드로어: 열리면 안쪽으로 포커스 이동, Esc로 닫기
  useEffect(() => {
    if (!narrow || !drawerOpen) return
    slotRef.current?.querySelector<HTMLElement>('button, input, [tabindex]')?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      // 안쪽 컴포넌트(Select 등)가 이미 Esc를 처리했으면 드로어는 유지
      if (e.key === 'Escape' && !e.defaultPrevented) closeDrawer()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [narrow, drawerOpen])

  const drawerHidden = narrow && !drawerOpen

  return (
    <>
      <div
        ref={ref}
        className={cx(
          styles.layout,
          contained && styles.contained,
          narrow && styles.narrow,
          drawerOpen && styles.drawerOpen,
        )}
      >
        {/* 닫힌 드로어는 inert로 탭 이동·스크린리더에서 제외 */}
        <div ref={slotRef} className={styles.slot} inert={drawerHidden} aria-hidden={drawerHidden || undefined}>
          {sidebar}
        </div>
        {narrow && drawerOpen && (
          <button type="button" className={styles.backdrop} aria-label="메뉴 닫기" onClick={closeDrawer} tabIndex={-1} />
        )}
        {/* 드로어가 열려 있으면 뒤쪽 본문은 inert: 포커스가 드로어 밖으로 나가지 않음 */}
        <div className={styles.content} inert={narrow && drawerOpen}>
          {narrow && (
            <div className={styles.topbar}>
              <button
                ref={menuRef}
                type="button"
                className={styles.menu}
                onClick={() => setDrawerOpen(true)}
                aria-label="사이드바 열기"
                aria-expanded={drawerOpen}
              >
                <Icon name="sidebar" />
              </button>
              <BrandMark />
            </div>
          )}
          <main className={cx(styles.main, flush && styles.flush)}>{children}</main>
          {footer}
        </div>
      </div>
    </>
  )
}
