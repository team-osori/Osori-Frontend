import { useCallback, useEffect, useState } from 'react'

function readRoute(fallback: string) {
  return window.location.hash.replace(/^#/, '') || fallback
}

/** URL 해시(#/path)로 화면을 구분하는 최소 라우팅. 라우터 라이브러리를 도입하기 전까지 사용합니다. */
export function useHashRoute(fallback: string) {
  const [route, setRoute] = useState(() => readRoute(fallback))

  useEffect(() => {
    const onChange = () => setRoute(readRoute(fallback))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [fallback])

  const navigate = useCallback((to: string) => {
    window.location.hash = to
  }, [])

  return [route, navigate] as const
}
