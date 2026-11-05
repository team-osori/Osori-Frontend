import { cx } from '../../../lib/cx'
import type { Stage } from '../../../routes'
import { Icon } from '../../ui'
import styles from './StepItem.module.css'

/** done: 완료(✓), current: 현재 단계, todo: 진행 가능, locked: 잠금 */
export type StepStatus = 'done' | 'current' | 'todo' | 'locked'

const STATUS_TEXT: Record<StepStatus, string> = {
  done: '완료',
  current: '진행 중',
  todo: '열림',
  locked: '잠김',
}

type StepItemProps = {
  index: number
  label: string
  status: StepStatus
  /** 상태 대신 보여줄 작은 글씨 (예: v1 · 67문항 확정) */
  note?: string
  onClick?: () => void
}

export function StepItem({ index, label, status, note, onClick }: StepItemProps) {
  return (
    <button
      type="button"
      className={cx(styles.item, styles[status])}
      disabled={status === 'locked'}
      aria-current={status === 'current' ? 'step' : undefined}
      onClick={onClick}
    >
      <span className={styles.marker} aria-hidden data-motion={status === 'current' ? 'pulse' : undefined}>
        {status === 'done' ? '✓' : index}
      </span>
      <span className={styles.texts}>
        <span className={styles.label}>{label}</span>
        <span className={styles.status}>{note ?? STATUS_TEXT[status]}</span>
      </span>
      {status === 'locked' && <Icon name="lock" className={styles.lock} />}
    </button>
  )
}

type StageListProps = {
  stages: Stage[]
  /** 1부터 시작하는 현재 단계 */
  current: number
  /** 지금 보고 있는 화면. 없으면 단계 안 화면 목록을 강조하지 않음 (예: 프로젝트 설정) */
  currentRoute?: string
  /** 이 단계까지 진행 가능(이후는 잠금). 기본값은 current */
  unlockedUntil?: number
  /** 단계 번호(1~3)별 작은 글씨 */
  notes?: Partial<Record<number, string>>
  onSelect?: (route: string) => void
}

/** 사이드바 평가 단계 목록. 현재 단계 아래에 그 단계의 화면들을 펼쳐 보여줍니다. */
export function StageList({ stages, current, currentRoute, unlockedUntil = current, notes, onSelect }: StageListProps) {
  return (
    <ol className={styles.list}>
      {stages.map((stage, i) => {
        const index = i + 1
        const status: StepStatus =
          index < current ? 'done' : index === current ? (currentRoute ? 'current' : 'todo') : index <= unlockedUntil ? 'todo' : 'locked'
        const showScreens = index === current && currentRoute && stage.screens.length > 1
        return (
          <li key={stage.label}>
            <StepItem index={index} label={stage.label} status={status} note={notes?.[index]} onClick={() => onSelect?.(stage.screens[0].route)} />
            {showScreens && (
              <ul className={styles.screens}>
                {stage.screens.map((screen) => (
                  <li key={screen.route}>
                    <button
                      type="button"
                      className={cx(styles.screen, screen.route === currentRoute && styles.screenActive)}
                      aria-current={screen.route === currentRoute ? 'page' : undefined}
                      onClick={() => onSelect?.(screen.route)}
                    >
                      {screen.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}
