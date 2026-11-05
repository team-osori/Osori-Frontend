import type { ReactNode } from 'react'

/** 프로젝트 카드 그리드. 폭에 따라 3열 → 2열 → 1열로 자동 전환 */
export function ProjectCardGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        gap: 20,
      }}
    >
      {children}
    </div>
  )
}
