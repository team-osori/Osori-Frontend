import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { isApiError } from './ApiError'

type QueryState<T> = {
  data: T | undefined
  error: unknown
  loading: boolean
}

/**
 * 화면에 들어올 때 데이터를 불러옵니다. deps가 바뀌면 다시 불러오고, 이전 요청은 취소합니다.
 *
 * const { data, error, loading, reload } = useApiQuery((signal) => listProjects({ signal }), [])
 */
export function useApiQuery<T>(load: (signal: AbortSignal) => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<QueryState<T>>({ data: undefined, error: undefined, loading: true })
  const [version, setVersion] = useState(0)
  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    const controller = new AbortController()
    setState((prev) => ({ ...prev, error: undefined, loading: true }))
    // 잘못된 ID처럼 요청 전에 던지는 오류도 렌더 오류가 아니라 error로 보이게 Promise로 감쌈
    new Promise<T>((resolve) => resolve(loadRef.current(controller.signal)))
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, error: undefined, loading: false })
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState((prev) => ({ ...prev, error, loading: false }))
      })
    return () => controller.abort()
    // 호출하는 쪽이 넘긴 deps가 바뀌거나 reload를 부르면 다시 불러옴
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  /** 저장 응답처럼 서버에서 받은 최신 값으로 바로 바꿀 때 */
  const setData = useCallback((data: T | ((prev: T | undefined) => T)) => {
    setState((prev) => ({
      ...prev,
      data: typeof data === 'function' ? (data as (p: T | undefined) => T)(prev.data) : data,
    }))
  }, [])

  return { ...state, reload, setData }
}

/**
 * 저장 · 삭제처럼 버튼을 눌러 보내는 요청. 진행 중 여부와 오류, 입력창별 오류를 함께 관리합니다.
 *
 * const save = useApiMutation((input: ProjectCreate) => createProject(input))
 * await save.run(input)  // 실패하면 save.error, save.fieldErrors에 담기고 undefined를 돌려줌
 */
export function useApiMutation<Args extends unknown[], T>(mutate: (...args: Args) => Promise<T>) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>()
  const mutateRef = useRef(mutate)
  mutateRef.current = mutate

  const run = useCallback(async (...args: Args): Promise<T | undefined> => {
    setPending(true)
    setError(undefined)
    try {
      return await mutateRef.current(...args)
    } catch (e) {
      setError(e)
      return undefined
    } finally {
      setPending(false)
    }
  }, [])

  const reset = useCallback(() => setError(undefined), [])
  const fieldErrors = isApiError(error) ? error.fieldMessages() : {}

  return { run, pending, error, fieldErrors, reset }
}
