import { useEffect, useMemo, useState } from 'react'
import { Button, StatCard, useToast } from '../components/ui'
import { ActionBar, ErrorNotice, PageHeader, ProjectSidebar, useProjectNav, type ActionBarStatus } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { errorMessage, isApiError, useApiQuery } from '../lib/api'
import { lineDiff } from '../lib/lineDiff'
import { ROUTES } from '../routes'
import { useConnection } from '../features/connection/useConnection'
import {
  cancelEvaluation,
  getEvaluation,
  getEvaluationInputs,
  listEvaluationItems,
  listEvaluations,
  resumeEvaluation,
  startEvaluation,
  type EvaluationItemSummary,
} from '../features/evaluation/api'
import { getProject } from '../features/project'
import { getPromptVersion, usePromptVersions, usePrompts } from '../features/prompt'
import { useProjectService } from '../features/service'
import { PromptDiffCard, RunProgressCard, VersionCard } from '../features/abRun/RunCards'
import { StopRunModal } from '../features/abRun/StopRunModal'
import type { RunRow, RunStatus } from '../features/abRun/types'
import styles from './AbRunPage.module.css'

const ACTIVE = ['QUEUED', 'RUNNING']
const POLL_MS = 2500
/** 실행 현황에 보여줄 문항 수 (나머지는 진행 수로만 표시) */
const ROW_LIMIT = 100

const callStatus = (status: string): RunStatus => (status === 'RUNNING' ? 'running' : status === 'NOT_RUN' ? 'waiting' : 'done')

type AbRunPageProps = {
  projectId: string
  onShowResults?: () => void
  onBack?: () => void
}

/** 평가 2단계 · 프롬프트 A/B 실행: 같은 시험지로 두 프롬프트 버전의 답을 받아 비교 */
export default function AbRunPage({ projectId, onShowResults, onBack }: AbRunPageProps) {
  const toast = useToast()
  const refreshSummary = useProjectNav()?.current?.reload
  const project = useApiQuery((signal) => getProject(projectId, { signal }), [projectId])
  const { service } = useProjectService(projectId)
  const serviceId = service?.id
  const { connection, verified } = useConnection(projectId, serviceId)
  const prompts = usePrompts(projectId, serviceId)
  const promptId = prompts.items[0]?.id
  const versions = usePromptVersions(projectId, serviceId, promptId)
  const testSet = project.data?.progress?.testSet ?? null

  // 고른 비교 버전. 처음에는 최신 버전(B)과 그 바로 전 버전(A)
  const [picked, setPicked] = useState<{ base?: string; candidate?: string }>({})
  const base = picked.base ?? versions.items[1]?.id
  const candidate = picked.candidate ?? versions.items[0]?.id
  const labelOf = (id?: string) => {
    const v = versions.items.find((x) => x.id === id)
    return v ? `v${v.version}` : '—'
  }

  // 가장 최근 A/B 실행. 새로 시작하면 그 실행으로 바꿈
  const [startedId, setStartedId] = useState<string>()
  const latest = useApiQuery(
    async (signal) => {
      if (!serviceId) return null
      const page = await listEvaluations(projectId, serviceId, { limit: 20, signal })
      return page.items.find((e) => e.mode === 'COMPARE') ?? null
    },
    [projectId, serviceId],
  )
  const runId = startedId ?? latest.data?.id
  const run = useApiQuery(
    (signal) => (serviceId && runId ? getEvaluation(projectId, serviceId, runId, { signal }) : Promise.resolve(null)),
    [projectId, serviceId, runId],
  )
  const items = useApiQuery(
    async (signal) => (serviceId && runId ? (await listEvaluationItems(projectId, serviceId, runId, { limit: ROW_LIMIT, signal })).items : []),
    [projectId, serviceId, runId],
  )
  // 실행에 실제로 쓴 두 버전 (고른 버전과 다를 수 있음)
  const inputs = useApiQuery(
    (signal) => (serviceId && runId ? getEvaluationInputs(projectId, serviceId, runId, { signal }) : Promise.resolve(null)),
    [projectId, serviceId, runId],
  )
  const active = Boolean(run.data && ACTIVE.includes(run.data.status))

  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => {
      run.reload()
      items.reload()
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [active, run.reload, items.reload])

  // 고른 두 버전의 원문으로 줄 단위 차이를 만듦
  const diff = useApiQuery(
    async (signal) => {
      if (!serviceId || !promptId || !base || !candidate) return null
      const [from, to] = await Promise.all([
        getPromptVersion(projectId, serviceId, promptId, base, { signal }),
        getPromptVersion(projectId, serviceId, promptId, candidate, { signal }),
      ])
      return { lines: lineDiff(from.content, to.content), memo: to.changeNote ?? undefined }
    },
    [projectId, serviceId, promptId, base, candidate],
  )

  const [stopOpen, setStopOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const runPrompts = (inputs.data as { prompts?: { a?: { version?: number }; b?: { version?: number } } } | null)?.prompts
  const runLabels = {
    a: runPrompts?.a?.version != null ? `v${runPrompts.a.version}` : labelOf(base),
    b: runPrompts?.b?.version != null ? `v${runPrompts.b.version}` : labelOf(candidate),
  }
  const rows: RunRow[] = useMemo(
    () => (items.data ?? []).map((it, i) => ({ id: it.id, question: it.question, order: it.questionNumber ?? i + 1 })),
    [items.data],
  )
  const byId = useMemo(() => new Map((items.data ?? []).map((it) => [it.id, it])), [items.data])
  const doneCount = (side: 'aCallStatus' | 'bCallStatus') =>
    (items.data ?? []).filter((it: EvaluationItemSummary) => callStatus(it[side]) === 'done').length
  const total = run.data?.totalQuestions ?? testSet?.questionCount ?? 0

  const blockers = [
    testSet?.status !== 'confirmed' && '1단계에서 시험지를 확정해 주세요.',
    !(connection && verified) && '프로젝트 설정에서 서비스 연결 테스트를 통과해 주세요.',
    versions.items.length < 2 && '비교하려면 프롬프트 버전이 두 개 이상 있어야 합니다.',
    base && candidate && base === candidate && '서로 다른 두 버전을 골라 주세요.',
  ].filter(Boolean) as string[]

  async function start() {
    if (!serviceId || !connection || !testSet || !base || !candidate || blockers.length > 0) return
    setBusy(true)
    try {
      const started = await startEvaluation(projectId, serviceId, {
        connectionRevision: connection.revision,
        testSetVersionId: testSet.versionId,
        aPromptVersionId: base,
        bPromptVersionId: candidate,
      })
      setStartedId(started.id)
      refreshSummary?.()
    } catch (error) {
      toast.error(errorMessage(error, 'A/B 실행을 시작하지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  async function stop() {
    if (!serviceId || !runId) return
    setStopOpen(false)
    try {
      await cancelEvaluation(projectId, serviceId, runId)
      run.reload()
      items.reload()
    } catch (error) {
      toast.error(errorMessage(error, '중단하지 못했습니다.'))
    }
  }

  async function resume() {
    if (!serviceId || !runId || !connection) return
    setBusy(true)
    try {
      await resumeEvaluation(projectId, serviceId, runId, connection.revision)
      run.reload()
      items.reload()
    } catch (error) {
      // 그 사이 연결 설정을 바꿨으면 이어서 실행할 수 없음 → 새로 실행해야 함
      const changed = isApiError(error) && error.status === 409
      toast.error(changed ? '연결 설정이 실행 때와 달라 이어서 실행할 수 없습니다. 새로 실행해 주세요.' : errorMessage(error, '이어서 실행하지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const state = run.data?.status
  const status: ActionBarStatus = !run.data
    ? { tone: 'neutral', label: blockers[0] ?? '실행 전' }
    : active
      ? { tone: 'primary', label: `실행 중 · ${run.data.completedQuestions} / ${total}` }
      : state === 'CANCELLED'
        ? { tone: 'neutral', label: `중단됨 · ${run.data.completedQuestions} / ${total}` }
        : state === 'FAILED'
          ? { tone: 'danger', label: '실행 실패' }
          : { tone: 'success', label: state === 'PARTIAL_FAILED' ? `완료 · 실패 ${run.data.failedQuestions}문항` : '실행 완료' }

  const loadError = project.error ?? latest.error ?? run.error
  const finished = state === 'COMPLETED' || state === 'PARTIAL_FAILED'

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          promptOptions={[{ value: 'ab', label: `${labelOf(base)} vs ${labelOf(candidate)}` }]}
          promptValue="ab"
          current={ROUTES.abRun}
          onBack={onBack}
        />
      }
      footer={
        <ActionBar status={status}>
          {active && (
            <Button variant="tonal" onClick={() => setStopOpen(true)}>
              중단
            </Button>
          )}
          {state === 'CANCELLED' && (
            <Button variant="tonal" onClick={resume} disabled={busy}>
              이어서 실행
            </Button>
          )}
          {!active && (
            <Button variant={finished ? 'tonal' : 'primary'} onClick={start} disabled={busy || blockers.length > 0}>
              {run.data ? '고른 버전으로 새로 실행' : '실행 시작'}
            </Button>
          )}
          {finished && <Button onClick={onShowResults}>채점 결과 보기</Button>}
        </ActionBar>
      }
    >
      <div className={styles.page}>
        <PageHeader title="프롬프트 A/B 실행" />
        {loadError !== undefined && loadError !== null && <ErrorNotice error={loadError} title="실행 정보를 불러오지 못했습니다" onRetry={() => (project.reload(), latest.reload(), run.reload())} />}

        <div className={styles.summary}>
          <VersionCard
            options={versions.items.map((v) => ({ value: v.id, label: `v${v.version}${v.label ? ` · ${v.label}` : ''}` }))}
            base={base ?? ''}
            candidate={candidate ?? ''}
            onChange={(patch) => setPicked((p) => ({ ...p, ...patch }))}
          />
          <StatCard label="질문 세트" value={testSet ? `${testSet.label} · ${testSet.questionCount}문항` : '없음'} />
          <StatCard label="이번 실행" value={run.data ? `${runLabels.a} vs ${runLabels.b}` : '아직 없음'} />
        </div>

        <div className={styles.body}>
          <RunProgressCard
            total={total}
            versions={[
              { version: runLabels.a, label: active ? '답변 수집 중' : '완료', done: doneCount('aCallStatus'), tone: 'muted' },
              {
                version: runLabels.b,
                label: active ? '답변 수집 중' : state === 'CANCELLED' ? '중단됨' : '완료',
                done: doneCount('bCallStatus'),
                tone: 'primary',
              },
            ]}
            rows={rows}
            statusOf={(row, side) => {
              const it = byId.get(row.id)
              return it ? callStatus(side === 0 ? it.aCallStatus : it.bCallStatus) : 'waiting'
            }}
            // 목록 응답에는 응답 시간이 없어 표시하지 않음
            latencyOf={() => null}
          />
          <PromptDiffCard from={labelOf(base)} to={labelOf(candidate)} lines={diff.data?.lines ?? []} memo={diff.data?.memo} />
        </div>
      </div>

      <StopRunModal
        open={stopOpen && active}
        onClose={() => setStopOpen(false)}
        version={`${runLabels.a} vs ${runLabels.b}`}
        done={run.data?.completedQuestions ?? 0}
        total={total}
        onStop={stop}
      />
    </AppLayout>
  )
}
