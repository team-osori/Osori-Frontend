/**
 * 비동기 작업(연결 테스트 · 평가 실행)은 요청하면 바로 `202`와 함께 상태(QUEUED 등)만 돌려주고,
 * 결과는 같은 리소스를 다시 조회해서 확인합니다. 이 파일은 "끝날 때까지 기다리는" 공통 부분입니다.
 */

export class PollingTimeoutError extends Error {
  constructor(message = '시간 안에 작업이 끝나지 않았습니다.') {
    super(message)
    this.name = 'PollingTimeoutError'
  }
}

export type PollOptions<T> = {
  /** 최신 상태를 가져오는 함수 */
  fetch: (signal: AbortSignal) => Promise<T>
  /** true를 돌려주면 더 기다리지 않고 끝냅니다 */
  isDone: (value: T) => boolean
  /** 첫 조회 전과 조회 사이에 기다리는 시간(ms). 조회할 때마다 늘어나 maxIntervalMs에서 멈춥니다 */
  intervalMs?: number
  maxIntervalMs?: number
  /** 이 시간이 지나도 끝나지 않으면 PollingTimeoutError (ms) */
  timeoutMs?: number
  /** 상태가 바뀔 때마다 부름 (진행률 표시 등) */
  onUpdate?: (value: T) => void
  signal?: AbortSignal
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * 끝날 때까지 주기적으로 조회합니다. 끝나면 마지막 값을 돌려줍니다.
 * - 조회 사이 간격은 조금씩 늘어나서(1.5배) 서버에 부담을 덜 줍니다.
 * - 조회가 실패하면 그 오류를 그대로 던집니다 (일시적 실패를 숨기지 않음).
 * - signal이 취소되면 AbortError를 던지고 더 조회하지 않습니다.
 */
export async function pollUntil<T>(options: PollOptions<T>): Promise<T> {
  const { fetch, isDone, onUpdate, signal, intervalMs = 1000, maxIntervalMs = 5000, timeoutMs = 120_000 } = options
  const started = Date.now()
  let wait = intervalMs

  for (;;) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    // 호출 쪽 signal과 별개로, 이번 조회만 끊을 수 있게 같은 signal을 전달
    const value = await fetch(signal ?? new AbortController().signal)
    onUpdate?.(value)
    if (isDone(value)) return value
    if (Date.now() - started + wait > timeoutMs) throw new PollingTimeoutError()
    await sleep(wait, signal)
    wait = Math.min(Math.round(wait * 1.5), maxIntervalMs)
  }
}
