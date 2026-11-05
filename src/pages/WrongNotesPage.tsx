import { useMemo, useState } from 'react'
import { ErrorNotice, ProjectSidebar, useProjectNav } from '../components/common'
import { Sticker, useToast } from '../components/ui'
import { cx } from '../lib/cx'
import { AppLayout } from '../layouts/AppLayout'
import { errorMessage, isApiError, useApiQuery } from '../lib/api'
import { ROUTES } from '../routes'
import chevronIcon from '../assets/icons/stage/chevron-right.svg'
import chevronSmIcon from '../assets/icons/stage/chevron-right-sm.svg'
import trendIcon from '../assets/icons/stage/trend-arrow.svg'
import { useConnection } from '../features/connection/useConnection'
import { getEvaluationItem, getGradingBoard, listEvaluationItems, rerunEvaluation } from '../features/evaluation/api'
import { getProject } from '../features/project'
import { createPromptVersion, usePrompts } from '../features/prompt'
import { useProjectService } from '../features/service'
import {
  createSuggestion,
  getSuggestion,
  listSuggestions,
  selectSuggestions,
  SUGGESTION_ITEMS_MAX,
  targetedItems,
  type Suggestion,
} from '../features/wrongNotes/suggestionApi'
import { CAUSE, causeOf, whyOf, type WrongCause } from '../features/wrongNotes/wrongView'
import {
  CountTabs,
  Dot,
  Pager,
  Pill,
  PrimaryAction,
  SecondaryAction,
  SectionLabel,
  StageCard,
  StageFooter,
  StageHeader,
  Well,
} from '../features/stage/StageUI'
import styles from './WrongNotesPage.module.css'

type Filter = 'all' | WrongCause

type WrongNotesPageProps = {
  projectId: string
  /** 고친 프롬프트로 재시험을 시작하면 채점 화면으로 */
  onRetest?: () => void
}

/** 08 3단계 · 오답 노트: 틀린 이유를 보고 프롬프트를 고쳐 다시 시험 */
export default function WrongNotesPage({ projectId, onRetest }: WrongNotesPageProps) {
  const toast = useToast()
  const refreshSummary = useProjectNav()?.current?.reload
  const project = useApiQuery((signal) => getProject(projectId, { signal }), [projectId])
  const { service } = useProjectService(projectId)
  const serviceId = service?.id
  const { connection } = useConnection(projectId, serviceId)
  const prompts = usePrompts(projectId, serviceId)
  const prompt = prompts.items[0]
  const evaluationId = project.data?.progress?.evaluation?.id

  // 평가에 쓴 프롬프트 버전 (수정 제안의 기준 버전)
  const board = useApiQuery(
    (signal) =>
      serviceId && evaluationId
        ? getGradingBoard(projectId, serviceId, evaluationId, { signal })
        : Promise.resolve(null),
    [projectId, serviceId, evaluationId],
  )
  const wrong = useApiQuery(
    async (signal) =>
      serviceId && evaluationId
        ? (
            await listEvaluationItems(projectId, serviceId, evaluationId, {
              screenStatus: 'INCORRECT',
              limit: 100,
              signal,
            })
          ).items
        : [],
    [projectId, serviceId, evaluationId],
  )
  const items = useMemo(() => (wrong.data ?? []).map((it) => ({ ...it, cause: causeOf(it) })), [wrong.data])

  // 이 평가로 만든 가장 최근 수정 제안 (실패한 것은 건너뜀)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const latest = useApiQuery(
    async (signal) => {
      if (!serviceId || !evaluationId) return null
      const page = await listSuggestions(projectId, serviceId, {
        limit: 20,
        signal,
      })
      const found = page.items.find((s) => s.evaluationId === evaluationId && s.status !== 'FAILED')
      return found ? getSuggestion(projectId, serviceId, found.id, { signal }) : null
    },
    [projectId, serviceId, evaluationId],
  )
  const current_ = suggestion ?? latest.data ?? null

  const [filter, setFilter] = useState<Filter>('all')
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [full, setFull] = useState(false)
  const [busy, setBusy] = useState<'generate' | 'select' | 'save' | 'retest' | null>(null)

  const list = useMemo(() => items.filter((i) => filter === 'all' || i.cause === filter), [items, filter])
  const changeFilter = (next: Filter) => {
    setFilter(next)
    setIndex(0)
    setOpen(false)
    setFull(false)
  }
  const current = Math.min(index, Math.max(0, list.length - 1))
  const item = list[current]
  const detail = useApiQuery(
    (signal) =>
      serviceId && evaluationId && item
        ? getEvaluationItem(projectId, serviceId, evaluationId, item.id, {
            signal,
          })
        : Promise.resolve(null),
    [projectId, serviceId, evaluationId, item?.id],
  )
  const view = detail.data ? whyOf(detail.data) : null

  const count = (cause: WrongCause) => items.filter((i) => i.cause === cause).length
  const edits = current_?.suggestions ?? []
  const editsFor = (itemId: string) => edits.filter((e) => current_ && targetedItems(current_, e).includes(itemId))
  const selected = current_?.selectedSuggestionIds ?? []
  const targeted = current_?.estimate.targetedQuestionCount ?? 0
  const nextVersion = prompt ? `v${prompt.version + 1}` : '새 버전'
  const applied = Boolean(current_?.appliedPromptVersionId)

  /** 오답 문항으로 수정 제안 만들기 (프롬프트 원인 문항 우선, 최대 20개). 모델 호출이라 1분 가까이 걸릴 수 있음 */
  async function generate() {
    if (!serviceId || !evaluationId || !board.data?.promptVersionId) return
    const promptFirst = [...items].sort((a, b) => Number(b.cause === 'prompt') - Number(a.cause === 'prompt'))
    setBusy('generate')
    try {
      const created = await createSuggestion(projectId, serviceId, {
        evaluationId,
        baseVersionId: board.data.promptVersionId,
        itemIds: promptFirst.slice(0, SUGGESTION_ITEMS_MAX).map((i) => i.id),
      })
      setSuggestion(created)
      if (created.status === 'FAILED') toast.error(created.error?.message ?? '수정 제안을 만들지 못했습니다.')
      else toast.success(`수정 제안 ${created.suggestions.length}개를 만들었습니다.`)
    } catch (error) {
      toast.error(errorMessage(error, '수정 제안을 만들지 못했습니다.'))
    } finally {
      setBusy(null)
    }
  }

  async function toggleApply(editId: string) {
    if (!serviceId || !current_ || applied) return
    const next = selected.includes(editId) ? selected.filter((id) => id !== editId) : [...selected, editId]
    setBusy('select')
    try {
      setSuggestion(await selectSuggestions(projectId, serviceId, current_.id, current_.revision, next))
    } catch (error) {
      if (isApiError(error) && error.code === 'OVERLAPPING_SUGGESTIONS')
        toast.warning('같은 부분을 고치는 다른 제안과 함께 적용할 수 없습니다. 하나만 고르세요.')
      else toast.error(errorMessage(error, '적용하지 못했습니다.'))
      if (isApiError(error) && error.status === 409)
        setSuggestion(await getSuggestion(projectId, serviceId, current_.id).catch(() => current_))
    } finally {
      setBusy(null)
    }
  }

  /** 고른 수정안으로 새 프롬프트 버전 저장. 이미 저장했으면 그 버전 ID */
  async function saveVersion(): Promise<string | undefined> {
    if (!serviceId || !current_ || !prompt) return undefined
    if (current_.appliedPromptVersionId) return current_.appliedPromptVersionId
    const version = await createPromptVersion(projectId, serviceId, prompt.id, {
      baseVersionId: current_.baseVersionId,
      content: current_.previewContent ?? '',
      suggestionId: current_.id,
      suggestionRevision: current_.revision,
      label: '오답 노트 수정 제안 반영',
      changeNote: `수정 제안 ${selected.length}개 적용`,
    })
    setSuggestion(await getSuggestion(projectId, serviceId, current_.id))
    prompts.reload()
    refreshSummary?.()
    return version.id
  }

  async function saveOnly() {
    if (!current_ || selected.length === 0) return
    setBusy('save')
    try {
      await saveVersion()
      toast.success(`${nextVersion}로 저장했습니다.`)
    } catch (error) {
      toast.error(errorMessage(error, '새 버전을 저장하지 못했습니다.'))
    } finally {
      setBusy(null)
    }
  }

  async function retest() {
    if (!serviceId || !evaluationId || !connection) return
    setBusy('retest')
    try {
      const promptVersionId = await saveVersion()
      if (!promptVersionId) return
      await rerunEvaluation(projectId, serviceId, evaluationId, {
        connectionRevision: connection.revision,
        promptVersionId,
      })
      refreshSummary?.()
      toast.success('새 프롬프트로 재시험을 시작했습니다.')
      onRetest?.()
    } catch (error) {
      toast.error(errorMessage(error, '재시험을 시작하지 못했습니다.'))
    } finally {
      setBusy(null)
    }
  }

  const loadError = project.error ?? wrong.error ?? board.error
  if (loadError) {
    return (
      <AppLayout sidebar={<ProjectSidebar current={ROUTES.wrongNotes} unlockedUntil={3} />}>
        <StageHeader title="오답 노트" />
        <ErrorNotice
          error={loadError}
          title="오답 노트를 불러오지 못했습니다"
          onRetry={() => (project.reload(), wrong.reload(), board.reload())}
        />
      </AppLayout>
    )
  }
  if (!project.data || (evaluationId && !wrong.data)) return null

  return (
    <AppLayout
      sidebar={<ProjectSidebar current={ROUTES.wrongNotes} unlockedUntil={3} />}
      footer={
        items.length > 0 && (
          <StageFooter
            actions={
              <>
                <SecondaryAction onClick={applied || busy || selected.length === 0 ? undefined : saveOnly}>
                  {applied ? `${nextVersion} 저장됨` : busy === 'save' ? '저장하는 중…' : `${nextVersion} 저장만`}
                </SecondaryAction>
                <PrimaryAction disabled={(!applied && selected.length === 0) || busy !== null} onClick={retest}>
                  {busy === 'retest' ? '재시험 시작하는 중…' : `${nextVersion}로 재시험`}
                </PrimaryAction>
              </>
            }
          >
            <span>
              수정 제안 <b>{selected.length}개</b> 적용됨
            </span>
          </StageFooter>
        )
      }
    >
      <div className={styles.page}>
        <StageHeader
          title="오답 노트"
          aside={
            // 서버는 해결 수를 예측하지 않아서(NOT_ESTIMABLE), 고른 수정안이 겨냥한 문항 수를 보여줌
            <div
              className={styles.forecast}
              aria-label={`틀린 문항 ${items.length}개 중 고른 수정안이 겨냥한 문항 ${targeted}개`}
            >
              <span className={styles.forecastLabel}>틀린 문항</span>
              <span className={styles.wrongCount}>
                <i aria-hidden>✕</i>
                <b>{items.length}</b>
              </span>
              <img src={trendIcon} alt="" width={18} height={18} />
              <span className={styles.wrongCount}>
                <b key={targeted} data-motion="pop">
                  {targeted}
                </b>
              </span>
              <span className={styles.forecastHint}>수정안 대상</span>
            </div>
          }
        />

        <CountTabs
          label="틀린 원인"
          value={filter}
          onChange={changeFilter}
          items={[
            { value: 'all', label: '전체', count: items.length },
            ...(['prompt', 'search', 'model'] as const).map((c) => ({
              value: c,
              label: CAUSE[c].label,
              count: count(c),
              dot: <Dot color={CAUSE[c].color} shape={CAUSE[c].shape} size={10} />,
            })),
          ]}
        />

        {!evaluationId && (
          <p className={styles.notFixable}>아직 채점한 평가가 없습니다. 2단계에서 응시하고 채점해 주세요.</p>
        )}
        {evaluationId && items.length === 0 && <p className={styles.notFixable}>틀린 문항이 없습니다.</p>}
        {item && (
          <StageCard
            className={styles.card}
            decoration={<Sticker name="paperclipLime" width={70} rot={20} motion="sway" />}
          >
            <div key={item.id} className={styles.cardBody} data-motion="rise">
              <div className={styles.meta}>
                <span className={styles.number}>
                  <b>{current + 1}</b> / {list.length}
                </span>
                <span className={styles.divider} aria-hidden />
                {item.cause ? (
                  <Pill dot={<Dot color={CAUSE[item.cause].color} shape={CAUSE[item.cause].shape} size={10} />}>
                    예상 {CAUSE[item.cause].label}
                  </Pill>
                ) : (
                  <Pill>원인 가설 없음</Pill>
                )}
                {current_ && (
                  <Pill
                    className={styles.fixable}
                    dot={<Dot color={editsFor(item.id).length ? 'var(--color-correct)' : 'var(--color-pending)'} />}
                  >
                    {editsFor(item.id).length ? '고칠 수 있음' : '수정 제안 없음'}
                  </Pill>
                )}
              </div>

              <h2 className={styles.question}>
                <span className={styles.cross} aria-hidden>
                  ✕
                </span>
                {item.question}
              </h2>

              <Well
                label="챗봇 답변"
                className={styles.answer}
                aside={
                  <button type="button" className={styles.more} onClick={() => setFull((v) => !v)} aria-expanded={full}>
                    {full ? '접기' : '전체 보기'}
                    <img src={chevronSmIcon} alt="" width={14} height={14} className={cx(full && styles.up)} />
                  </button>
                }
              >
                <p className={cx(styles.answerText, full && styles.answerFull)}>{view?.answer ?? ''}</p>
              </Well>

              <section className={styles.why}>
                <SectionLabel>왜 틀렸나</SectionLabel>
                <p className={styles.whyText}>
                  {(view?.why ?? []).map((part, i) =>
                    part.mark ? (
                      <mark key={i} className={cx(styles.mark, styles[part.mark])}>
                        {part.text}
                      </mark>
                    ) : (
                      <span key={i}>{part.text}</span>
                    ),
                  )}
                </p>
              </section>

              {!current_ ? (
                <div className={styles.suggest}>
                  <button
                    type="button"
                    className={styles.suggestHead}
                    onClick={generate}
                    disabled={busy !== null || !board.data?.promptVersionId}
                  >
                    <Sticker name="sparkle" width={18} />
                    <span className={styles.suggestTitle}>
                      {busy === 'generate'
                        ? '수정 제안 만드는 중… (1분 정도 걸려요)'
                        : `오답 ${Math.min(items.length, SUGGESTION_ITEMS_MAX)}문항으로 수정 제안 만들기`}
                    </span>
                  </button>
                  {!board.data?.promptVersionId && (
                    <p className={styles.notFixable}>
                      프롬프트 버전을 지정해 채점한 평가에서만 수정 제안을 만들 수 있어요.
                    </p>
                  )}
                </div>
              ) : editsFor(item.id).length > 0 ? (
                <div className={cx(styles.suggest, open && styles.suggestOpen)}>
                  <button
                    type="button"
                    className={styles.suggestHead}
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                  >
                    <Sticker name="sparkle" width={18} />
                    <span className={styles.suggestTitle}>수정 제안 보기</span>
                    <Pill dot={<i className={styles.pillCross}>✕</i>}>{editsFor(item.id).length}개</Pill>
                    <img
                      src={chevronIcon}
                      alt=""
                      width={20}
                      height={20}
                      className={cx(styles.chevron, open && styles.chevronOpen)}
                    />
                  </button>
                  {open &&
                    editsFor(item.id).map((edit) => (
                      <div key={edit.id} className={styles.suggestBody}>
                        <div className={styles.diff}>
                          <p className={styles.del}>
                            <span aria-hidden>−</span>
                            {edit.originalText}
                          </p>
                          <p className={styles.ins}>
                            <span aria-hidden>+</span>
                            {edit.replacementText}
                          </p>
                        </div>
                        <p className={styles.notFixable}>{edit.reason}</p>
                        <button
                          type="button"
                          className={cx(styles.apply, selected.includes(edit.id) && styles.applied)}
                          onClick={() => toggleApply(edit.id)}
                          disabled={applied || busy !== null}
                          aria-pressed={selected.includes(edit.id)}
                        >
                          {selected.includes(edit.id) ? `✓ ${nextVersion}에 적용됨` : `${nextVersion}에 적용`}
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className={styles.notFixable}>
                  {item.cause === 'search'
                    ? '프롬프트가 아니라 검색 설정(문서 색인 · 조각 크기)을 확인해야 해요.'
                    : item.cause === 'model'
                      ? '같은 질문을 여러 번 돌려 보거나 다른 모델과 비교해 보세요.'
                      : '이 문항을 겨냥한 수정 제안이 없습니다.'}
                </p>
              )}
            </div>
          </StageCard>
        )}

        <Pager
          label="틀린 문항 번호"
          current={current}
          onChange={(i) => {
            setIndex(i)
            setOpen(false)
            setFull(false)
          }}
          items={list.map((w, i) => ({
            id: w.id,
            label: String(i + 1),
            marker: w.cause ? (
              <Dot color={CAUSE[w.cause].color} shape={CAUSE[w.cause].shape} size={8} />
            ) : (
              <Dot color="var(--color-pending)" size={8} />
            ),
          }))}
        />
      </div>
    </AppLayout>
  )
}
