import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { Icon } from '../components/ui'
import { SidebarContext } from '../components/common/Sidebar/SidebarContext'
import styles from './AppLayout.module.css'

/** 레이아웃 폭이 이 값 미만이면 사이드바를 드로어로 띄움 */
const DRAWER_BREAKPOINT = 1024

type AppLayoutProps = {
  sidebar: ReactNode
  children: ReactNode
  /** 화면 전체가 아니라 부모 박스 크기에 맞출 때 */
  contained?: boolean
}

/** 사이드바 + 본문 레이아웃. 넓은 화면은 접기, 좁은 화면은 드로어로 동작합니다. */
export function AppLayout({ sidebar, children, contained }: AppLayoutProps) {
  const ref = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  const [narrow, setNarrow] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
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

  // 데스크톱 접기/펼치기 후, 새로 보이는 버튼으로 포커스 이동 (첫 렌더는 제외)
  const toggledRef = useRef(false)
  useEffect(() => {
    if (!toggledRef.current) return
    toggledRef.current = false
    if (collapsed) menuRef.current?.focus()
    else slotRef.current?.querySelector<HTMLElement>('[data-sidebar-toggle]')?.focus()
  }, [collapsed])

  const toggleCollapsed = (next: boolean) => {
    toggledRef.current = true
    setCollapsed(next)
  }

  const control = useMemo(
    () => ({ toggle: () => (narrow ? closeDrawer() : toggleCollapsed(!collapsed)) }),
    [narrow, collapsed],
  )

  const showTopbar = narrow || collapsed
  const drawerHidden = narrow && !drawerOpen
  const openSidebar = () => (narrow ? setDrawerOpen(true) : toggleCollapsed(false))

  return (
    <SidebarContext.Provider value={control}>
      <div
        ref={ref}
        className={cx(
          styles.layout,
          contained && styles.contained,
          narrow && styles.narrow,
          !narrow && collapsed && styles.collapsed,
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
          {showTopbar && (
            <div className={styles.topbar}>
              <button
                ref={menuRef}
                type="button"
                className={styles.menu}
                onClick={openSidebar}
                aria-label="사이드바 열기"
                aria-expanded={narrow ? drawerOpen : !collapsed}
              >
                <Icon name="sidebar" />
              </button>
              <span className={styles.topbarTitle}>프롬프트 평가</span>
            </div>
          )}
          <main className={styles.main}>{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
