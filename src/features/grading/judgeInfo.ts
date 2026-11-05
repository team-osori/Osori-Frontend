import type { StatusTone } from '../../components/ui'
import type { JudgeStatus, QueueReason } from './types'

/** 대기열에 들어온 이유: 이름, 상세 화면 상단 태그 문구, 점 색 */
export const REASON_INFO: Record<QueueReason, { label: string; detail: string; tone: StatusTone }> = {
  split: { label: '갈림', detail: '채점자 의견 갈림', tone: 'primary' },
  unstable: { label: '불안정', detail: '반복 판정 불안정', tone: 'caution' },
  sample: { label: '샘플', detail: '합의 샘플 확인', tone: 'accent' },
}

export const REASON_ORDER: QueueReason[] = ['split', 'unstable', 'sample']

export const STATUS_LABEL: Record<JudgeStatus, string> = {
  waiting: '대기',
  judging: '판정 중',
  pass: '통과',
  fail: '실패',
}
