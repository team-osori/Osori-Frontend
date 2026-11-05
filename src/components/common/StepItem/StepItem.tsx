import { cx } from '../../../lib/cx'
import { Icon } from '../../ui'
import styles from './StepItem.module.css'

/** done: 완료(✓), current: 현재 단계, todo: 진행 가능, locked: 잠금 */
export type StepStatus = 'done' | 'current' | 'todo' | 'locked'

type StepItemProps = {
  index: number
  label: string
  status: StepStatus
  onClick?: () => void
}

export function StepItem({ index, label, status, onClick }: StepItemProps) {
  return (
    <button
      type="button"
      className={cx(styles.item, styles[status])}
      disabled={status === 'locked'}
      aria-current={status === 'current' ? 'step' : undefined}
      onClick={onClick}
    >
      <span className={styles.marker} aria-hidden>
        {status === 'done' ? '✓' : index}
      </span>
      <span className={styles.label}>{label}</span>
      {status === 'locked' && <Icon name="lock" />}
    </button>
  )
}

export const EVALUATION_STEPS = [
  '연결 설정',
  '질문 세트',
  '프롬프트 A/B 실행',
  '자동 채점 결과',
  '사람 판정',
  '원인 진단',
  '개선안 적용',
] as const

type StepListProps = {
  /** 1부터 시작하는 현재 단계 */
  current: number
  /** 이 단계까지 진행 가능(이후는 잠금). 기본값은 current */
  unlockedUntil?: number
  steps?: readonly string[]
  /** false면 현재 단계를 강조하지 않음(예: 프로젝트 설정 화면) */
  highlightCurrent?: boolean
  onSelect?: (index: number) => void
}

export function StepList({
  current,
  unlockedUntil = current,
  steps = EVALUATION_STEPS,
  highlightCurrent = true,
  onSelect,
}: StepListProps) {
  return (
    <ol style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: 0, padding: 0, listStyle: 'none' }}>
      {steps.map((label, i) => {
        const index = i + 1
        const status: StepStatus =
          index < current ? 'done' : index === current ? (highlightCurrent ? 'current' : 'todo') : index <= unlockedUntil ? 'todo' : 'locked'
        return (
          <li key={label}>
            <StepItem index={index} label={label} status={status} onClick={() => onSelect?.(index)} />
          </li>
        )
      })}
    </ol>
  )
}
