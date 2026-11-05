import { useEffect, useMemo, useState } from 'react'
import { ErrorNotice, ProjectSidebar, useProjectNav } from '../components/common'
import { Modal, useToast } from '../components/ui'
import { cx } from '../lib/cx'
import { AppLayout } from '../layouts/AppLayout'
import { errorMessage, isApiError, useApiQuery } from '../lib/api'
import { ROUTES } from '../routes'
import chevronIcon from '../assets/icons/stage/chevron-right-sm.svg'
import { useConnection } from '../features/connection/useConnection'
import { getEvaluationItem, getGradingBoard, reviewAnswer, startEvaluation } from '../features/evaluation/api'
import { getProject } from '../features/project'
import { usePrompts } from '../features/prompt'
import { useProjectService } from '../features/service'
import { STATUS_TEXT, toDetail, toSeat, type Verdict } from '../features/scoring/scoringView'
import { Kbd, PersonGlyph, Pill, PrimaryAction, SectionLabel, StageCard, StageHeader, Well } from '../features/stage/StageUI'
import styles from './ScoringPage.module.css'

const COLOR: Record<Verdict | 'none' | 'current', string> = {
  correct: 'var(--color-correct)',
  wrong: 'var(--color-wrong)',
  none: 'var(--color-pending)',
  current: '#fff',
}

const TERMINAL = ['COMPLETED', 'PARTIAL_FAILED', 'FAILED', 'CANCELLED']
/** 실행 중 채점 칸을 다시 불러오는 간격 */
const POLL_MS = 2500

type ScoringPageProps = {
  projectId: string
  /** 다 채점하고 오답 노트로 */
  onFinish?: () => void
}

/** 07 2단계 · 채점: 시험지로 챗봇을 응시시키고, 답을 채점 기준과 비교해 맞음 / 틀림 */
export default function ScoringPage({ projectId, onFinish }: ScoringPageProps) {
  const toast = useToast()
  const refreshSummary = useProjectNav()?.current?.reload
  const project = useApiQuery((signal) => getProject(projectId, { signal }), [projectId])
  const { service } = useProjectService(projectId)
  const serviceId = service?.id
  const evaluationId = project.data?.progress?.evaluation?.id

  const board = useApiQuery(
    (signal) => (serviceId && evaluationId ? getGradingBoard(projectId, serviceId, evaluationId, { signal }) : Promise.resolve(null)),
    [projectId, serviceId, evaluationId],
  )
  const running = Boolean(board.data && !TERMINAL.includes(board.data.evaluationStatus))

  // 실행 중이면 칸 상태를 주기적으로 다시 받음
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(board.reload, POLL_MS)
    return () => window.clearInterval(timer)
  }, [running, board.reload])

  const items = useMemo(() => (board.data?.items ?? []).map(toSeat), [board.data])
  const [index, setIndex] = useState<number | null>(null)
  // 처음에는 아직 O/X를 안 남긴 첫 문항부터
  const current = index ?? Math.max(0, items.findIndex((i) => i.canReview && i.verdict === null))
  const seat = items[current]
  const [answerOpen, setAnswerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const item = useApiQuery(
    (signal) =>
      serviceId && evaluationId && seat ? getEvaluationItem(projectId, serviceId, evaluationId, seat.id, { signal }) : Promise.resolve(null),
    // 같은 문항이라도 채점 중 답이 들어오면 다시 받음
    [projectId, serviceId, evaluationId, seat?.id, seat?.screenStatus],
  )
  const detail = item.data ? toDetail(item.data) : null

  const correct = items.filter((i) => i.verdict === 'correct').length
  const wrong = items.filter((i) => i.verdict === 'wrong').length
  const left = items.filter((i) => i.canReview && i.verdict === null).length
  const unavailable = items.filter((i) => !i.canReview).length
  const promptLabel = board.data?.promptVersion != null ? `v${board.data.promptVersion}` : board.data?.useConfiguredPrompt ? '연결 설정' : '—'

  const go = (next: number) => setIndex(Math.min(items.length - 1, Math.max(0, next)))

  /** O/X를 저장하고 다음 안 한 문항으로 */
  const judge = async (verdict: Verdict) => {
    if (!serviceId || !evaluationId || !seat || !seat.canReview || saving) return
    setSaving(true)
    try {
      await reviewAnswer(projectId, serviceId, evaluationId, seat.id, {
        expectedRevision: seat.reviewRevision,
        verdict: verdict === 'correct' ? 'pass' : 'fail',
      })
      const next = items.findIndex((it, i) => i > current && it.canReview && it.verdict === null)
      const any = items.findIndex((it, i) => i !== current && it.canReview && it.verdict === null)
      go(next !== -1 ? next : any !== -1 ? any : current)
      board.reload()
    } catch (error) {
      // 그 사이 다른 사람이 판정했으면(409) 최신 상태를 다시 받음
      if (isApiError(error) && error.status === 409) board.reload()
      toast.error(errorMessage(error, '판정을 저장하지 못했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  // J · K 이전 · 다음, O 맞음, X 틀림
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, [role="dialog"]')) return
      const k = e.key.toLowerCase()
      if (k === 'j') go(current - 1)
      else if (k === 'k') go(current + 1)
      else if (k === 'o') judge('correct')
      else if (k === 'x') judge('wrong')
      else return
      e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const loadError = project.error ?? board.error
  if (loadError) {
    return (
      <AppLayout sidebar={<ProjectSidebar current={ROUTES.scoring} unlockedUntil={2} />}>
        <div className={styles.page}>
          <StageHeader title="채점" />
          <ErrorNotice error={loadError} title="채점 정보를 불러오지 못했습니다" onRetry={() => (project.reload(), board.reload())} />
        </div>
      </AppLayout>
    )
  }
  if (!project.data || (evaluationId && !board.data)) return null

  // 아직 응시하지 않았으면 시작 화면
  if (!evaluationId || !seat) {
    return (
      <StartPanel
        projectId={projectId}
        serviceId={serviceId}
        testSet={project.data.progress?.testSet ?? null}
        onStarted={() => {
          project.reload()
          refreshSummary?.()
        }}
      />
    )
  }

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          current={ROUTES.scoring}
          stageNotes={{ 2: running ? `응시 중 ${board.data?.processedQuestions ?? 0} / ${items.length}` : `${correct + wrong} / ${items.length} 채점` }}
          unlockedUntil={2}
        />
      }
    >
      <div className={styles.page}>
        <StageHeader
          title="채점"
          aside={
            <div className={styles.score} aria-label={`정답 ${correct}, 오답 ${wrong}, ${current + 1}번째 / ${items.length}문항`}>
              <span className={styles.scoreItem}>
                <PersonGlyph color={COLOR.correct} size={22} />
                <b>{correct}</b>
              </span>
              <span className={styles.scoreItem}>
                <PersonGlyph color={COLOR.wrong} size={22} />
                <b>{wrong}</b>
              </span>
              <span className={styles.scoreRule} aria-hidden />
              <span className={styles.position}>
                <b>{current + 1}</b> / {items.length}
              </span>
            </div>
          }
        />

        <div className={styles.layout}>
          <StageCard className={styles.sheet}>
            <div className={styles.sheetHead}>
              <h2>응시 문항</h2>
              <span>
                {current + 1} / {items.length}
              </span>
            </div>
            <ul className={styles.legend}>
              <li>
                <PersonGlyph color={COLOR.correct} size={18} /> 정답 {correct}
              </li>
              <li>
                <PersonGlyph color={COLOR.wrong} size={18} /> 오답 {wrong}
              </li>
              <li>
                <PersonGlyph color={COLOR.none} size={18} /> 남음 {left}
              </li>
              {unavailable > 0 && <li>{running ? `응시 중 ${unavailable}` : `답변 없음 ${unavailable}`}</li>}
            </ul>
            <ol className={styles.grid}>
              {items.map((it, i) => {
                const active = i === current
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      className={cx(styles.seat, active && styles.seatActive)}
                      onClick={() => go(i)}
                      aria-current={active ? 'true' : undefined}
                      aria-label={`${it.number}번 ${it.verdict === 'correct' ? '정답' : it.verdict === 'wrong' ? '오답' : it.canReview ? '채점 전' : STATUS_TEXT[it.screenStatus]}`}
                    >
                      <PersonGlyph color={active ? COLOR.current : COLOR[it.verdict ?? 'none']} />
                      <span>{it.number}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <button type="button" className={styles.toNotes} disabled={left > 0 || running} onClick={() => onFinish?.()}>
              {running ? '응시 중…' : left > 0 ? `${left}문항 남음` : '오답 노트로'}
            </button>
          </StageCard>

          <StageCard className={styles.detail}>
            <div key={seat.id} className={styles.detailBody} data-motion="rise">
              <div className={styles.meta}>
                <span className={styles.no}>{seat.number}</span>
                {seat.typeLabel && <Pill>{seat.typeLabel}</Pill>}
                <Pill className={styles.version}>프롬프트 {promptLabel}</Pill>
                {seat.aiStatus !== 'REMAINING' && <Pill>AI 판정 · {STATUS_TEXT[seat.aiStatus]}</Pill>}
              </div>
              <h2 className={styles.question}>{detail?.question ?? ''}</h2>

              <Well
                label="챗봇 답변"
                className={styles.answer}
                aside={
                  <button type="button" className={styles.more} onClick={() => setAnswerOpen(true)} aria-haspopup="dialog">
                    전체 보기
                    <img src={chevronIcon} alt="" width={14} height={14} />
                  </button>
                }
              >
                <p className={styles.answerText}>{detail?.answer ?? (seat.canReview ? '' : STATUS_TEXT[seat.screenStatus])}</p>
              </Well>

              <section className={styles.block}>
                <SectionLabel>채점 기준</SectionLabel>
                <ul className={styles.criteria}>
                  {(detail?.criteria ?? []).map((c) => (
                    <li key={c.id} className={styles.criterion}>
                      {c.met ? <span className={styles.ring} aria-hidden /> : <span className={styles.cross} aria-hidden>✕</span>}
                      <span className={styles.criterionText}>{c.text}</span>
                      <b className={c.met ? styles.met : styles.missed}>{c.met ? '충족' : c.met === false ? '빠짐' : '판정 못 함'}</b>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.block}>
                <SectionLabel>해설</SectionLabel>
                <p className={styles.explain}>
                  {detail?.explanation.ref && <span className={styles.ref}>{detail.explanation.ref}</span>}
                  {detail?.explanation.text}
                </p>
              </section>

              <div className={styles.actions}>
                <span className={styles.keys}>
                  <Kbd>J</Kbd>
                  <Kbd>K</Kbd>
                  이전 · 다음
                </span>
                <button
                  type="button"
                  className={cx(styles.verdict, styles.correct, seat.verdict === 'correct' && styles.chosen)}
                  onClick={() => judge('correct')}
                  disabled={!seat.canReview || saving}
                  aria-pressed={seat.verdict === 'correct'}
                >
                  <span className={styles.bigRing} aria-hidden />
                  맞음
                  <Kbd>O</Kbd>
                </button>
                <button
                  type="button"
                  className={cx(styles.verdict, styles.wrong, seat.verdict === 'wrong' && styles.chosen)}
                  onClick={() => judge('wrong')}
                  disabled={!seat.canReview || saving}
                  aria-pressed={seat.verdict === 'wrong'}
                >
                  <span className={styles.bigCross} aria-hidden>
                    ✕
                  </span>
                  틀림
                  <Kbd tone="dark">X</Kbd>
                </button>
              </div>
            </div>
          </StageCard>
        </div>
      </div>

      <Modal open={answerOpen} onClose={() => setAnswerOpen(false)} size="xl" eyebrow={`챗봇 답변 · 프롬프트 ${promptLabel}`} title={detail?.question ?? ''}>
        <p className={styles.fullAnswer}>{detail?.answer}</p>
      </Modal>
    </AppLayout>
  )
}

/* ---------- 응시 시작 ---------- */

type StartPanelProps = {
  projectId: string
  serviceId?: string
  testSet: { versionId: string; label: string; status: 'draft' | 'confirmed'; questionCount: number } | null
  onStarted: () => void
}

/** 시험지 · 연결 · 프롬프트가 준비됐는지 보여주고, 챗봇에게 시험지 전체를 풀게 함 */
function StartPanel({ projectId, serviceId, testSet, onStarted }: StartPanelProps) {
  const toast = useToast()
  const { connection, verified } = useConnection(projectId, serviceId)
  const prompts = usePrompts(projectId, serviceId)
  const prompt = prompts.items[0]
  const [starting, setStarting] = useState(false)

  const checks = [
    { ok: testSet?.status === 'confirmed', text: testSet ? `시험지 ${testSet.label} · ${testSet.questionCount}문항${testSet.status === 'confirmed' ? ' 확정' : ' (확정 전)'}` : '시험지 없음', fix: '1단계에서 시험지를 확정해 주세요.' },
    { ok: Boolean(connection && verified), text: connection ? (verified ? '서비스 연결 테스트 통과' : '서비스 연결 테스트 필요') : '서비스 연결 없음', fix: '프로젝트 설정 > 서비스 연결에서 연결 테스트를 통과해 주세요.' },
    { ok: Boolean(prompt), text: prompt ? `시스템 프롬프트 v${prompt.version}` : '시스템 프롬프트 없음', fix: '프로젝트 설정 > 프롬프트에서 저장해 주세요.' },
  ]
  const ready = checks.every((c) => c.ok)

  async function start() {
    if (!ready || !serviceId || !connection || !testSet || !prompt || starting) return
    setStarting(true)
    try {
      await startEvaluation(projectId, serviceId, {
        mode: 'SINGLE',
        connectionRevision: connection.revision,
        testSetVersionId: testSet.versionId,
        promptVersionId: prompt.currentVersionId,
      })
      toast.success('응시를 시작했습니다. 답이 들어오는 대로 채점할 수 있습니다.')
      onStarted()
    } catch (error) {
      toast.error(errorMessage(error, '응시를 시작하지 못했습니다.'))
    } finally {
      setStarting(false)
    }
  }

  return (
    <AppLayout sidebar={<ProjectSidebar current={ROUTES.scoring} unlockedUntil={2} />}>
      <div className={styles.page}>
        <StageHeader title="채점" />
        <StageCard className={styles.start}>
          <h2 className={styles.startTitle}>챗봇에게 시험지를 풀게 할까요?</h2>
          <p className={styles.startLead}>시험지의 모든 문제를 챗봇에 보내고, 받은 답을 채점 기준으로 자동 판정합니다. 그다음 문제마다 맞음 · 틀림을 확인합니다.</p>
          <ul className={styles.startChecks}>
            {checks.map((c) => (
              <li key={c.text} className={c.ok ? styles.checkOk : styles.checkMissing}>
                <span aria-hidden>{c.ok ? '✓' : '!'}</span>
                <span>
                  {c.text}
                  {!c.ok && <small>{c.fix}</small>}
                </span>
              </li>
            ))}
          </ul>
          <PrimaryAction disabled={!ready || starting} onClick={start}>
            {starting ? '시작하는 중…' : '응시 시작'}
          </PrimaryAction>
        </StageCard>
      </div>
    </AppLayout>
  )
}
