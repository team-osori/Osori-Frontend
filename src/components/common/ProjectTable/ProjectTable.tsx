import type { CSSProperties } from 'react'
import { cx } from '../../../lib/cx'
import { STAGES } from '../../../routes'
import { CountUp, Icon, Sticker } from '../../ui'
import styles from './ProjectTable.module.css'

export type ProjectStatus = 'done' | 'running' | 'setup'

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  done: '완료',
  running: '진행 중',
  setup: '준비 중',
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

export type ProjectRowData = {
  id: string
  name: string
  host: string
  status: ProjectStatus
  scores: ProjectScores
  /** 진행 중인 단계(1~3) */
  currentStep: number
  /** 마지막 평가 날짜 (YYYY-MM-DD ...). 없으면 null */
  lastEvaluatedAt: string | null
  promptVersion: number | null
}

/** 막대에 채울 칸 수: 지금 단계까지. 완료 프로젝트는 전부 */
function doneSteps(row: ProjectRowData) {
  return row.status === 'done' ? STAGES.length : row.currentStep
}

function ProjectRow({ row, index, onOpen }: { row: ProjectRowData; index: number; onOpen?: () => void }) {
  const done = doneSteps(row)
  const stage = STAGES[Math.min(row.currentStep, STAGES.length) - 1]
  return (
    <li style={{ '--i': index } as CSSProperties}>
      <button type="button" className={cx(styles.row, styles[row.status])} onClick={onOpen} aria-label={`${row.name} 열기`}>
        <span className={styles.project}>
          <Sticker name="folder" width={40} className={styles.folder} />
          <span className={styles.titles}>
            <span className={styles.name}>{row.name}</span>
            <span className={styles.meta}>
              <span className={cx(styles.badge, styles[row.status])}>
                <span className={styles.dot} aria-hidden />
                {PROJECT_STATUS_LABEL[row.status]}
              </span>
              <span className={styles.host}>{row.host}</span>
            </span>
          </span>
        </span>

        <span className={styles.progress}>
          <span className={styles.segments} aria-hidden>
            {STAGES.map((s, i) => (
              <span key={s.label} className={styles.segment}>
                {i < done && (
                  <span
                    className={styles.filled}
                    data-motion="fill"
                    style={{ '--delay': `${300 + index * 55 + i * 120}ms` } as CSSProperties}
                  />
                )}
              </span>
            ))}
          </span>
          <span className={styles.progressText}>
            {done} / {STAGES.length} · {stage.label}
          </span>
        </span>

        <span className={styles.scores}>
          {METRICS.map(({ key, label }) => (
            <span key={key} className={styles.score}>
              <span className={styles.scoreLabel}>{label}</span>
              <span className={cx(styles.scoreValue, row.scores[key] == null && styles.empty)}>
                {row.scores[key] == null ? '—' : <CountUp value={row.scores[key]} delay={250 + index * 55} />}
              </span>
            </span>
          ))}
        </span>

        <span className={styles.date}>
          {row.lastEvaluatedAt ? (
            <>
              <span className={styles.dateValue}>{row.lastEvaluatedAt.slice(0, 10)}</span>
              {row.promptVersion != null && <span className={styles.version}>v{row.promptVersion}</span>}
            </>
          ) : (
            <>
              <span className={cx(styles.dateValue, styles.empty)}>—</span>
              <span className={styles.version}>기록 없음</span>
            </>
          )}
        </span>

        <Icon name="chevronRight" className={styles.chevron} />
      </button>
    </li>
  )
}

type ProjectTableProps = {
  rows: ProjectRowData[]
  onOpen?: (row: ProjectRowData) => void
}

/** 02 프로젝트 목록 표: 프로젝트 · 진행 단계 · 최신 통과율 · 최근 평가 */
export function ProjectTable({ rows, onOpen }: ProjectTableProps) {
  return (
    <section className={styles.table} aria-label="프로젝트 목록">
      <div className={styles.head} aria-hidden>
        <span>프로젝트</span>
        <span>진행 단계</span>
        <span>최신 통과율 (%)</span>
        <span>최근 평가</span>
      </div>
      <ul className={styles.body} data-motion="stagger">
        {rows.map((row, index) => (
          <ProjectRow key={row.id} row={row} index={index} onOpen={() => onOpen?.(row)} />
        ))}
      </ul>
    </section>
  )
}
