import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { IconName } from '../../../assets/icons'
import { cx } from '../../../lib/cx'
import { Icon } from '../Icon/Icon'
import styles from './Toast.module.css'

export type ToastTone = 'success' | 'error' | 'warning'

type ToastItem = { id: number; message: string; tone: ToastTone; duration: number; leaving?: boolean }

type ToastOptions = { tone?: ToastTone; /** 자동으로 사라지기까지(ms). 기본 4초 */ duration?: number }

type ToastApi = {
  show: (message: string, options?: ToastOptions) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
}

const MAX_VISIBLE = 3
const LEAVE_MS = 160
const ICON: Record<ToastTone, IconName> = { success: 'checkSuccess', error: 'circleXDanger', warning: 'warningAmber' }

const ToastContext = createContext<ToastApi | null>(null)

/** 앱 전체에서 쓰는 토스트. App 바깥(main.tsx)에서 한 번 감쌉니다. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const remove = useCallback((id: number) => {
    // 사라지는 애니메이션 뒤에 목록에서 뺌
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), LEAVE_MS)
  }, [])

  const show = useCallback((message: string, { tone = 'success', duration = 4000 }: ToastOptions = {}) => {
    const id = nextId.current++
    setItems((prev) => [...prev, { id, message, tone, duration }].slice(-MAX_VISIBLE))
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message) => show(message, { tone: 'success' }),
      error: (message) => show(message, { tone: 'error', duration: 6000 }),
      warning: (message) => show(message, { tone: 'warning' }),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <ol className={styles.viewport} aria-label="알림">
          {items.map((item) => (
            <Toast key={item.id} item={item} onClose={() => remove(item.id)} />
          ))}
        </ol>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

/** 토스트 한 개. 마우스를 올리거나 포커스하면 사라지는 시간을 멈춤 */
function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [paused, setPaused] = useState(false)
  const remaining = useRef(item.duration)

  useEffect(() => {
    if (paused || item.leaving) return
    const started = Date.now()
    const timer = window.setTimeout(onClose, remaining.current)
    return () => {
      window.clearTimeout(timer)
      remaining.current -= Date.now() - started
    }
  }, [paused, item.leaving, onClose])

  return (
    <li
      // 오류는 바로 읽어 주고, 나머지는 하던 안내가 끝난 뒤 읽어 줌
      role={item.tone === 'error' ? 'alert' : 'status'}
      className={cx(styles.toast, styles[item.tone], item.leaving && styles.leaving)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className={styles.badge} aria-hidden>
        <Icon name={ICON[item.tone]} />
      </span>
      <p className={styles.message}>{item.message}</p>
      <button type="button" className={styles.close} onClick={onClose} aria-label="알림 닫기">
        <Icon name="xSm" />
      </button>
    </li>
  )
}

export function useToast() {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast는 ToastProvider 안에서만 쓸 수 있습니다.')
  return api
}
