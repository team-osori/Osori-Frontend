/** done 완료 · running 진행 중 · waiting 대기 */
export type RunStatus = 'done' | 'running' | 'waiting'

export type RunRow = {
  id: string
  question: string
  /** 전체 실행 순서 (1부터). 진행 수와 비교해 상태를 정함 */
  order: number
}

export type RunState = 'running' | 'stopped' | 'finished'
