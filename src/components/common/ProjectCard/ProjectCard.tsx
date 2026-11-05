import { Card, ProgressBar, StatusBadge, type StatusTone } from '../../ui'
import styles from './ProjectCard.module.css'

export type ProjectStatus = 'done' | 'running' | 'setup'

const STATUS: Record<ProjectStatus, { tone: StatusTone; label: string; action: string }> = {
  done: { tone: 'success', label: '완료', action: '결과 보기' },
  running: { tone: 'warning', label: '평가 중', action: '이어서 하기' },
  setup: { tone: 'neutral', label: '설정 필요', action: '설정 시작' },
}

/** 점수(0~100). 평가 기록이 없으면 null */
export type ProjectScores = {
  retrieval: number | null
  grounding: number | null
  response: number | null
  policy: number | null
}

const METRICS: Array<{ key: keyof ProjectScores; label: string }> = [
  { key: 'retrieval', label: '검색' },
  { key: 'grounding', label: '근거' },
  { key: 'response', label: '응답' },
  { key: 'policy', label: '정책' },
]

type ProjectCardProps = {
  name: string
  meta: string
  status: ProjectStatus
  scores: ProjectScores
  progressText: string
  onAction?: () => void
}

export function ProjectCard({ name, meta, status, scores, progressText, onAction }: ProjectCardProps) {
  const s = STATUS[status]
  return (
    <Card as="article" className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titles}>
          <h3 className={styles.title}>{name}</h3>
          <span className={styles.meta}>{meta}</span>
        </div>
        <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
      </div>

      <dl className={styles.metrics}>
        {METRICS.map(({ key, label }) => {
          const value = scores[key]
          return (
            <div key={key} className={styles.metric}>
              <div className={styles.metricHead}>
                <dt>{label}</dt>
                <dd>{value == null ? '—' : `${value}%`}</dd>
              </div>
              <ProgressBar value={value} label={`${label} 점수`} />
            </div>
          )
        })}
      </dl>

      <div className={styles.footer}>
        <span className={styles.progress}>{progressText}</span>
        <button type="button" className={styles.action} onClick={onAction}>
          {s.action}
        </button>
      </div>
    </Card>
  )
}
