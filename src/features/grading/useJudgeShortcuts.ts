import { useEffect, useRef } from 'react'

type Shortcuts = {
  /** J: 이전 문항 */
  prev: () => void
  /** K: 다음 문항 */
  next: () => void
  /** F: 실패 */
  fail: () => void
  /** P: 통과 */
  pass: () => void
}

/** 입력 중인 칸에서는 단축키를 쓰지 않음 */
function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

/** 사람 판정 화면의 키보드 단축키 (J 이전 · K 다음 · F 실패 · P 통과) */
export function useJudgeShortcuts(handlers: Shortcuts, enabled = true) {
  const ref = useRef(handlers)
  useEffect(() => {
    ref.current = handlers
  })

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      // 조합키(Cmd+P 등)와 입력 중인 칸, 열려 있는 모달·패널 안에서는 무시
      if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing || isTyping(e.target)) return
      if ((e.target as HTMLElement | null)?.closest('[role="dialog"], [role="listbox"]')) return
      const handler = { j: ref.current.prev, k: ref.current.next, f: ref.current.fail, p: ref.current.pass }[e.key.toLowerCase()]
      if (!handler) return
      e.preventDefault()
      handler()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
