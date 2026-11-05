import { useEffect, useState } from 'react'
import type { RunState, RunStatus } from './types'

/** 문항당 예상 소요 시간(초). 남은 시간 표시에 사용 */
const SECONDS_PER_ITEM = 7

/**
 * A/B 실행 진행 상황.
 * 백엔드 실행 API가 정해지기 전까지 일정 간격으로 진행 수를 늘려 흉내 냅니다.
 */
export function useRunSimulation({
  total,
  initialDone,
  concurrency,
  tickMs = 1500,
}: {
  total: number
  initialDone: number
  concurrency: number
  tickMs?: number
}) {
  const [done, setDone] = useState(initialDone)
  const [state, setState] = useState<RunState>(initialDone >= total ? 'finished' : 'running')

  useEffect(() => {
    if (state !== 'running') return
    const timer = window.setInterval(() => setDone((d) => Math.min(total, d + 1)), tickMs)
    return () => window.clearInterval(timer)
  }, [state, total, tickMs])

  // 모두 끝나면 완료 상태로
  useEffect(() => {
    if (done >= total && state === 'running') setState('finished')
  }, [done, total, state])

  const statusOf = (order: number): RunStatus => {
    if (order <= done) return 'done'
    if (state === 'running' && order <= done + concurrency) return 'running'
    return 'waiting'
  }

  const remainingMinutes = Math.max(1, Math.round(((total - done) * SECONDS_PER_ITEM) / 60))

  return {
    done,
    state,
    statusOf,
    remainingMinutes,
    stop: () => setState('stopped'),
    resume: () => setState(done >= total ? 'finished' : 'running'),
  }
}
