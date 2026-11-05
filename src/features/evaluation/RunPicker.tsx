import { useMemo } from 'react'
import { Select } from '../../components/ui'
import { useApiQuery } from '../../lib/api'
import { listEvaluations, type Evaluation } from './api'

const STATUS_NOTE: Partial<Record<Evaluation['status'], string>> = {
  QUEUED: '대기 중',
  RUNNING: '진행 중',
  PARTIAL_FAILED: '일부 실패',
  FAILED: '실패',
  CANCELLED: '취소',
}

function when(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 이 서비스의 지난 응시(단일 평가) 목록. 최신이 먼저 */
export function useRunHistory(projectId: string, serviceId: string | undefined, reloadKey?: unknown) {
  const query = useApiQuery(
    async (signal) =>
      serviceId ? (await listEvaluations(projectId, serviceId, { limit: 100, signal })).items : [],
    [projectId, serviceId, reloadKey],
  )
  const runs = useMemo(
    () =>
      (query.data ?? [])
        .filter((run) => run.mode === 'SINGLE')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [query.data],
  )
  return { runs, reload: query.reload }
}

type RunPickerProps = {
  runs: Evaluation[]
  /** 지금 보고 있는 응시 */
  value: string | undefined
  /** 가장 최근 응시 (목록에 "최신"으로 표시) */
  latestId: string | undefined
  onChange: (evaluationId: string) => void
  className?: string
}

/** 새로 응시한 뒤에도 지난 응시 결과를 골라 볼 수 있는 드롭다운 */
export function RunPicker({ runs, value, latestId, onChange, className }: RunPickerProps) {
  if (runs.length < 2 || !value) return null
  const options = runs.map((run, index) => {
    const note = STATUS_NOTE[run.status]
    const label = [
      `응시 ${runs.length - index}`,
      when(run.createdAt),
      run.id === latestId ? '최신' : null,
      note ?? null,
    ]
      .filter(Boolean)
      .join(' · ')
    return { value: run.id, label }
  })
  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      size="sm"
      align="end"
      ariaLabel="볼 응시 결과 선택"
      className={className}
    />
  )
}
