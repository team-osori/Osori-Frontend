import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

const GAP = 6
/** 화면 가장자리와 띄울 최소 여백 */
const EDGE = 16

/**
 * 드롭다운 목록 위치·닫기 공통 로직.
 * 목록은 body에 portal로 띄우므로 화면 기준(fixed) 좌표를 계산하고, 아래 공간이 부족하면 위로 엽니다.
 */
export function usePopover({
  open,
  onClose,
  triggerRef,
  rootRef,
  popoverRef,
  align = 'start',
  maxHeight = 240,
  gap = GAP,
}: {
  open: boolean
  onClose: () => void
  triggerRef: RefObject<HTMLElement | null>
  rootRef: RefObject<HTMLElement | null>
  popoverRef: RefObject<HTMLElement | null>
  align?: 'start' | 'end'
  maxHeight?: number
  /** 트리거와 목록 사이 간격 (기본 6px) */
  gap?: number
}) {
  const [style, setStyle] = useState<CSSProperties>()

  useLayoutEffect(() => {
    if (!open) return
    // 목록이 트리거보다 넓으면 오른쪽 화면 밖으로 나가지 않게 왼쪽으로 당김
    const clampLeft = (left: number) => {
      const width = popoverRef.current?.offsetWidth ?? 0
      return Math.max(EDGE, Math.min(left, window.innerWidth - width - EDGE))
    }
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const below = window.innerHeight - rect.bottom - gap - 8
      const above = rect.top - gap - 8
      const openUp = below < 160 && above > below
      setStyle({
        position: 'fixed',
        minWidth: rect.width,
        maxHeight: Math.min(maxHeight, openUp ? above : below),
        ...(openUp ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
        ...(align === 'end' ? { right: window.innerWidth - rect.right } : { left: clampLeft(rect.left) }),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, align, maxHeight, gap, triggerRef, popoverRef])

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, onClose, rootRef, popoverRef])

  return style
}
