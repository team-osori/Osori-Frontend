import { useEffect, useState } from 'react'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** 0에서 value까지 숫자가 올라가는 표시. 움직임 줄이기 설정이면 바로 최종값 */
export function CountUp({ value, duration = 900, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const [shown, setShown] = useState(() => (reduceMotion() ? value : 0))

  useEffect(() => {
    if (reduceMotion()) return setShown(value)
    let frame = 0
    const start = performance.now() + delay
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration))
      // 끝으로 갈수록 천천히
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, delay])

  return <>{shown}</>
}
