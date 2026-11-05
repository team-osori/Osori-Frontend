import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Sticker } from '../../components/ui'
import { cx } from '../../lib/cx'
import arrowRight from '../../assets/icons/stage/arrow-right.svg'
import pagerNext from '../../assets/icons/stage/pager-next.svg'
import pagerPrev from '../../assets/icons/stage/pager-prev.svg'
import styles from './stage.module.css'

/* 시안 06~08이 함께 쓰는 부품 */

/** 큰 제목 + 아래 형광펜 낙서 */
export function StageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className={styles.title}>
      {children}
      <span className={styles.titleStroke} data-motion="draw" style={{ '--delay': '250ms' } as CSSProperties} aria-hidden>
        <Sticker name="squiggle" width={84} />
      </span>
    </h1>
  )
}

/** 제목 줄: 왼쪽 제목, 오른쪽 요약 */
export function StageHeader({ title, aside }: { title: ReactNode; aside?: ReactNode }) {
  return (
    <header className={styles.header}>
      <StageTitle>{title}</StageTitle>
      {aside && <div className={styles.headerAside}>{aside}</div>}
    </header>
  )
}

/** 둥근 알약 칩. dot을 주면 앞에 색 점 */
export function Pill({ children, dot, className }: { children: ReactNode; dot?: ReactNode; className?: string }) {
  return (
    <span className={cx(styles.pill, className)}>
      {dot}
      {children}
    </span>
  )
}

/** 색 점 (원 · 둥근 네모 · 납작한 네모로 원인 구분) */
export function Dot({ color, shape = 'circle', size = 8 }: { color: string; shape?: 'circle' | 'rounded' | 'bar'; size?: number }) {
  return (
    <span
      className={cx(styles.dot, styles[shape])}
      style={{ background: color, width: shape === 'bar' ? size * 1.25 : size, height: size }}
      aria-hidden
    />
  )
}

/** 키보드 단축키 표시 */
export function Kbd({ children, tone }: { children: ReactNode; tone?: 'dark' }) {
  return <kbd className={cx(styles.kbd, tone === 'dark' && styles.kbdDark)}>{children}</kbd>
}

/** 사람 모양 (머리 + 몸) */
export function PersonGlyph({ color, size = 32 }: { color: string; size?: number }) {
  const head = size * 0.5625
  return (
    <span className={styles.person} style={{ gap: size * 0.094 }} aria-hidden>
      <span className={styles.personHead} style={{ width: head, height: head, background: color }} />
      <span
        className={styles.personBody}
        style={{ width: size, height: head, background: color, borderRadius: `${size * 0.5}px ${size * 0.5}px ${size * 0.156}px ${size * 0.156}px` }}
      />
    </span>
  )
}

export type PagerItem = { id: string; label: string; marker: ReactNode; dim?: boolean }

type PagerProps = {
  items: PagerItem[]
  current: number
  onChange: (index: number) => void
  /** 한 번에 보여줄 번호 수 */
  window?: number
  /** 화살표 키로 이동 */
  keyboard?: boolean
  label: string
}

/** 번호 칸 이동 막대: ← 번호들 (←→ 안내) → */
export function Pager({ items, current, onChange, window: size = 9, keyboard = true, label }: PagerProps) {
  const go = (i: number) => onChange(Math.min(items.length - 1, Math.max(0, i)))

  useEffect(() => {
    if (!keyboard) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable], [role="dialog"]')) return
      if (e.key === 'ArrowLeft') go(current - 1)
      if (e.key === 'ArrowRight') go(current + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  // 현재 번호를 가운데 두고 앞뒤로 잘라 보여줌
  const start = Math.max(0, Math.min(current - Math.floor(size / 2), items.length - size))
  const visible = items.slice(start, start + size)

  return (
    <nav className={styles.pager} aria-label={label}>
      <button type="button" className={styles.pagerArrow} onClick={() => go(current - 1)} disabled={current === 0} aria-label="이전">
        <img src={pagerPrev} alt="" width={22} height={22} />
      </button>
      <ol className={styles.pagerList}>
        {visible.map((item, i) => {
          const index = start + i
          const active = index === current
          return (
            <li key={item.id}>
              <button
                type="button"
                className={cx(styles.pagerItem, active && styles.pagerActive, item.dim && !active && styles.pagerDim)}
                aria-current={active ? 'true' : undefined}
                aria-label={`${item.label}번`}
                onClick={() => go(index)}
              >
                <span>{item.label}</span>
                {item.marker}
              </button>
            </li>
          )
        })}
      </ol>
      {keyboard && (
        <span className={styles.pagerKeys} aria-hidden>
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
        </span>
      )}
      <button
        type="button"
        className={styles.pagerArrow}
        onClick={() => go(current + 1)}
        disabled={current === items.length - 1}
        aria-label="다음"
      >
        <img src={pagerNext} alt="" width={22} height={22} />
      </button>
    </nav>
  )
}

/** 하단 고정 바 */
export function StageFooter({ children, actions }: { children?: ReactNode; actions: ReactNode }) {
  return (
    <div className={styles.footer}>
      <div className={styles.footerInfo}>{children}</div>
      <div className={styles.footerActions}>{actions}</div>
    </div>
  )
}

/** 라임 주요 버튼 (→ 아이콘) */
export function PrimaryAction({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={styles.primary} onClick={onClick} disabled={disabled}>
      {children}
      <img src={arrowRight} alt="" width={18} height={18} />
    </button>
  )
}

export function SecondaryAction({ children, onClick, icon }: { children: ReactNode; onClick?: () => void; icon?: string }) {
  return (
    <button type="button" className={styles.secondary} onClick={onClick}>
      {icon && <img src={icon} alt="" width={18} height={18} />}
      {children}
    </button>
  )
}

/** 시안 카드 (짙은 회색 둥근 판) */
export function StageCard({ children, className, decoration }: { children: ReactNode; className?: string; decoration?: ReactNode }) {
  return (
    <section className={cx(styles.card, className)}>
      {decoration && <div className={styles.cardDecoration}>{decoration}</div>}
      {children}
    </section>
  )
}

/** 카드 안 움푹한 칸 (챗봇 답변 · 모범 답안) */
export function Well({ label, aside, children, className }: { label: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx(styles.well, className)}>
      <div className={styles.wellHead}>
        <span className={styles.label}>{label}</span>
        {aside}
      </div>
      {children}
    </div>
  )
}

/** 작은 회색 제목 */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <span className={styles.label}>{children}</span>
}

/** 필터 탭: 이름 + 개수 */
export function CountTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  aside,
}: {
  items: Array<{ value: T; label: string; count: number; dot?: ReactNode }>
  value: T
  onChange: (value: T) => void
  label: string
  aside?: ReactNode
}) {
  return (
    <div className={styles.tabs}>
      <div role="tablist" aria-label={label} className={styles.tabList}>
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={value === item.value}
            className={cx(styles.tab, value === item.value && styles.tabActive)}
            onClick={() => onChange(item.value)}
          >
            {item.dot}
            {item.label}
            <span className={styles.tabCount}>{item.count}</span>
          </button>
        ))}
      </div>
      {aside}
    </div>
  )
}
