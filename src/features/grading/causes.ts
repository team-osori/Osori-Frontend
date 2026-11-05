import type { FailureCause } from './types'

/** 실패 원인별 이름과 색. 06 분포 막대, 08 필터 · 배지가 함께 씁니다. */
export const CAUSE_INFO: Record<FailureCause, { label: string; color: string }> = {
  retrieval: { label: '검색', color: 'var(--color-accent)' },
  prompt: { label: '프롬프트', color: 'var(--color-primary)' },
  model: { label: '모델', color: 'var(--color-caution)' },
}

/** 화면에 보이는 순서 */
export const CAUSE_ORDER: FailureCause[] = ['retrieval', 'prompt', 'model']
