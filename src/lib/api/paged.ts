import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { isApiError } from './ApiError'
import type { Page } from './types'

type PagedState<T> = {
  items: T[]
  nextCursor: string | null
  /** 처음 불러오는 중 (목록 전체를 가림) */
  loading: boolean
  /** 다음 페이지를 불러오는 중 (목록은 그대로 보임) */
  loadingMore: boolean
  error: unknown
}

export type PagedOptions<T> = {
  /** 한 페이지를 가져오는 함수. cursor가 없으면 첫 페이지 */
  fetchPage: (query: { cursor: string | null; signal: AbortSignal }) => Promise<Page<T>>
  /** 항목을 구분하는 값. 이어 붙일 때 같은 항목이 두 번 들어오는 것을 막는 데 씁니다 */
  getKey: (item: T) => string
  /** 이 값이 바뀌면 처음부터 다시 불러옵니다 (예: 프로젝트가 바뀜, 필터가 바뀜) */
  deps?: DependencyList
  /** false면 아무것도 요청하지 않음 (필요한 ID가 아직 없을 때) */
  enabled?: boolean
}

/**
 * 커서 페이지네이션 목록. 첫 페이지를 불러오고, loadMore로 다음 페이지를 이어 붙입니다.
 *
 * - loadMore를 여러 번 눌러도 같은 페이지는 한 번만 요청합니다
 * - deps가 바뀌거나 reload를 부르면 이전 요청의 결과는 버립니다
 * - 이어 붙일 때 이미 있는 항목은 건너뜁니다
 */
export function usePagedList<T>({ fetchPage, getKey, deps = [], enabled = true }: PagedOptions<T>) {
  const [state, setState] = useState<PagedState<T>>({
    items: [],
    nextCursor: null,
    loading: enabled,
    loadingMore: false,
    error: undefined,
  })
  const [version, setVersion] = useState(0)
  // 진행 중인 다음 페이지 요청이 있으면 loadMore를 또 불러도 무시
  const loadingMoreRef = useRef(false)
  const controllerRef = useRef<AbortController | null>(null)
  const fetchRef = useRef(fetchPage)
  fetchRef.current = fetchPage
  const keyRef = useRef(getKey)
  keyRef.current = getKey

  useEffect(() => {
    const controller = new AbortController()
    controllerRef.current = controller
    loadingMoreRef.current = false

    if (!enabled) {
      setState({ items: [], nextCursor: null, loading: false, loadingMore: false, error: undefined })
      return () => controller.abort()
    }
    setState({ items: [], nextCursor: null, loading: true, loadingMore: false, error: undefined })

    // 잘못된 ID처럼 요청 전에 던지는 오류도 렌더 오류가 아니라 목록의 error로 보이게 Promise로 감쌈
    new Promise<Page<T>>((resolve) => resolve(fetchRef.current({ cursor: null, signal: controller.signal })))
      .then((page) => {
        if (controller.signal.aborted) return
        setState({ items: page.items, nextCursor: page.nextCursor, loading: false, loadingMore: false, error: undefined })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState((prev) => ({ ...prev, loading: false, error }))
      })

    return () => controller.abort()
    // deps는 호출하는 쪽이 정함. reload를 부르면 version이 바뀌어 다시 불러옴
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, version, ...deps])

  /** 다음 페이지를 이어 붙임. 이미 불러오는 중이거나 더 없으면 아무것도 하지 않음 */
  const loadMore = useCallback(async () => {
    const cursor = state.nextCursor
    const controller = controllerRef.current
    if (!cursor || loadingMoreRef.current || !controller || controller.signal.aborted) return
    loadingMoreRef.current = true
    setState((prev) => ({ ...prev, loadingMore: true, error: undefined }))
    try {
      const page = await fetchRef.current({ cursor, signal: controller.signal })
      if (controller.signal.aborted) return
      setState((prev) => {
        const known = new Set(prev.items.map(keyRef.current))
        const fresh = page.items.filter((item) => !known.has(keyRef.current(item)))
        return { ...prev, items: [...prev.items, ...fresh], nextCursor: page.nextCursor, loadingMore: false }
      })
    } catch (error) {
      if (controller.signal.aborted) return
      setState((prev) => ({ ...prev, loadingMore: false, error }))
    } finally {
      loadingMoreRef.current = false
    }
  }, [state.nextCursor])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  /** 서버 응답을 받은 항목을 목록 맨 앞에 넣음 (이미 있으면 그 자리를 새 값으로 교체) */
  const prepend = useCallback((item: T) => {
    setState((prev) => {
      const key = keyRef.current(item)
      return { ...prev, items: [item, ...prev.items.filter((i) => keyRef.current(i) !== key)] }
    })
  }, [])

  /** 서버에서 받은 최신 값으로 목록의 한 항목을 바꿈 (수정 응답 반영) */
  const replace = useCallback((item: T) => {
    setState((prev) => {
      const key = keyRef.current(item)
      return { ...prev, items: prev.items.map((i) => (keyRef.current(i) === key ? item : i)) }
    })
  }, [])

  /** 삭제 응답을 받은 항목을 목록에서 뺌 */
  const remove = useCallback((key: string) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((i) => keyRef.current(i) !== key) }))
  }, [])

  return {
    items: state.items,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    hasMore: state.nextCursor !== null,
    /** 세션이 끝났거나(401) 권한이 없을 때 */
    unauthorized: isApiError(state.error) && state.error.isUnauthorized,
    loadMore,
    reload,
    prepend,
    replace,
    remove,
  }
}

/** 한 페이지씩 끝까지 모두 가져옴 (항목이 적다고 알고 있을 때, 예: 정책 버전 전체). 취소하면 AbortError */
export async function fetchAllPages<T>(
  fetchPage: (query: { cursor: string | null; signal: AbortSignal }) => Promise<Page<T>>,
  signal: AbortSignal,
  maxPages = 50,
): Promise<T[]> {
  const all: T[] = []
  let cursor: string | null = null
  for (let i = 0; i < maxPages; i++) {
    const page: Page<T> = await fetchPage({ cursor, signal })
    all.push(...page.items)
    if (!page.nextCursor) return all
    cursor = page.nextCursor
  }
  throw new RangeError(`페이지가 ${maxPages}개를 넘어 중단했습니다.`)
}
