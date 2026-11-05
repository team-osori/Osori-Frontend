import { useId } from 'react'
import { Card, CardTitle, DiffView, ProgressBar, Select, StatusDot, Tag, type DiffLine, type SelectOption, type StatusTone } from '../../components/ui'
import type { RunRow, RunStatus } from './types'
import styles from './abRun.module.css'

/* ---------- 비교 버전 선택 ---------- */

type VersionCardProps = {
  options: SelectOption[]
  base: string
  candidate: string
  onChange: (patch: { base?: string; candidate?: string }) => void
}

export function VersionCard({ options, base, candidate, onChange }: VersionCardProps) {
  const labelId = useId()
  return (
    <Card className={styles.card} role="group" aria-labelledby={labelId}>
      <span id={labelId} className={styles.versionLabel}>
        비교 버전
      </span>
      <div className={styles.versions}>
        <Select
          size="field"
          ariaLabel="기준 버전"
          options={options.filter((o) => o.value !== candidate)}
          value={base}
          onChange={(v) => onChange({ base: v })}
        />
        <span className={styles.vs}>vs</span>
        <Select
          size="field"
          accent
          ariaLabel="비교 버전"
          options={options.filter((o) => o.value !== base)}
          value={candidate}
          onChange={(v) => onChange({ candidate: v })}
        />
      </div>
    </Card>
  )
}

/* ---------- 실행 현황 ---------- */

const STATUS: Record<RunStatus, { tone: StatusTone; label: string }> = {
  done: { tone: 'success', label: '완료' },
  running: { tone: 'primary', label: '진행 중' },
  waiting: { tone: 'muted', label: '대기' },
}

function RunStatusLabel({ status }: { status: RunStatus }) {
  const s = STATUS[status]
  return (
    <span className={styles.status}>
      <StatusDot tone={s.tone} size={8} />
      {s.label}
    </span>
  )
}

type VersionProgress = { version: string; label: string; done: number; tone: 'primary' | 'muted' }

type RunProgressCardProps = {
  total: number
  versions: [VersionProgress, VersionProgress]
  rows: RunRow[]
  statusOf: (row: RunRow, version: 0 | 1) => RunStatus
  latencyOf: (row: RunRow) => number | null
}

export function RunProgressCard({ total, versions, rows, statusOf, latencyOf }: RunProgressCardProps) {
  return (
    <Card className={styles.card}>
      <CardTitle>실행 현황</CardTitle>

      {versions.map((v) => (
        <div key={v.version} className={styles.progress}>
          <div className={styles.progressHead}>
            <Tag tone={v.tone === 'primary' ? 'primary' : 'default'}>{v.version}</Tag>
            {v.label}
            <span className={styles.progressCount}>
              {v.done} / {total}
            </span>
          </div>
          <ProgressBar size="md" tone={v.tone} value={(v.done / total) * 100} label={`${v.version} 진행률`} />
        </div>
      ))}

      <table className={styles.table}>
        <colgroup>
          <col className={styles.colQuestion} />
          <col className={styles.colStatus} />
          <col className={styles.colStatus} />
          <col className={styles.colTime} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">질문</th>
            <th scope="col">{versions[0].version}</th>
            <th scope="col">{versions[1].version}</th>
            <th scope="col">응답 시간</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const latency = latencyOf(row)
            return (
              <tr key={row.id}>
                <td className={styles.question} title={row.question}>
                  {row.question}
                </td>
                <td>
                  <RunStatusLabel status={statusOf(row, 0)} />
                </td>
                <td>
                  <RunStatusLabel status={statusOf(row, 1)} />
                </td>
                <td className={styles.time}>{latency == null ? '—' : `${latency.toFixed(1)}초`}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}

/* ---------- 버전 간 변경 ---------- */

export function PromptDiffCard({ from, to, lines, memo }: { from: string; to: string; lines: DiffLine[]; memo?: string }) {
  const added = lines.filter((l) => l.type === 'added').length
  const removed = lines.filter((l) => l.type === 'removed').length
  const summary = [added && `+${added}줄`, removed && `-${removed}줄`].filter(Boolean).join(' · ') || '변경 없음'
  return (
    <Card className={styles.card}>
      <div className={styles.diffHead}>
        <CardTitle>
          {from} → {to} 변경
        </CardTitle>
        <span className={styles.diffCount}>{summary}</span>
      </div>
      <DiffView lines={lines} ariaLabel={`${from}에서 ${to}로 바뀐 프롬프트`} />
      {memo && <p className={styles.memo}>메모 · {memo}</p>}
    </Card>
  )
}
