import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { Icon } from '../components/ui'
import { SidebarContext } from '../components/common/Sidebar/SidebarContext'
import styles from './AppLayout.module.css'

/** 이 폭 미만이면 사이드바를 드로어로 띄움 (tokens.css --breakpoint-drawer 와 동일) */
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
  const [narrow, setNarrow] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 뷰포트가 아니라 레이아웃 자체 폭 기준으로 판단 (박스 안에 넣어도 정확)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const isNarrow = entry.contentRect.width < DRAWER_BREAKPOINT
      setNarrow(isNarrow)
      if (!isNarrow) setDrawerOpen(false)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const control = useMemo(
    () => ({ toggle: () => (narrow ? setDrawerOpen(false) : setCollapsed((c) => !c)) }),
    [narrow],
  )

  const showTopbar = narrow || collapsed
  const openSidebar = () => (narrow ? setDrawerOpen(true) : setCollapsed(false))

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
        <div className={styles.slot}>{sidebar}</div>
        {narrow && drawerOpen && (
          <button type="button" className={styles.backdrop} aria-label="메뉴 닫기" onClick={() => setDrawerOpen(false)} />
        )}
        <div className={styles.content}>
          {showTopbar && (
            <div className={styles.topbar}>
              <button type="button" className={styles.menu} onClick={openSidebar} aria-label="사이드바 열기">
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
