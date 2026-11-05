import type { DraftCounts } from './types'

/** 자동 생성 기본 개수. 서버는 한 번에 최대 50개까지 만듭니다. */
export const DEFAULT_DRAFT_COUNTS: DraftCounts = { 정상: 4, 모호: 2, '문서에 없음': 2, '정책 함정': 2 }
export const DRAFT_TOTAL_MAX = 50
