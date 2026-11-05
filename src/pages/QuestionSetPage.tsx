import { useMemo, useState } from 'react'
import { ErrorNotice, ProjectSidebar, useProjectNav } from '../components/common'
import { Button, useToast } from '../components/ui'
import { AppLayout } from '../layouts/AppLayout'
import { errorMessage, isApiError, useApiQuery } from '../lib/api'
import { ROUTES } from '../routes'
import { DEFAULT_DRAFT_COUNTS } from '../features/questions/draftCounts'
import { editInput, inputOf, toQuestion, type QuestionEdit } from '../features/questions/questionView'
import { QuestionEditModal } from '../features/questions/QuestionEditModal'
import { ConfirmSetModal } from '../features/questions/ConfirmSetModal'
import {
  confirmTestSetVersion,
  createTestSetDraft,
  deleteQuestion,
  generateQuestions,
  getTestSet,
  getTestSetVersion,
  importQuestionsCsv,
  CSV_RULES,
  type TestSetVersion,
} from '../features/questions/testsetApi'
import { CATEGORY_OF, QUESTION_TYPES, type DraftCounts } from '../features/questions/types'
import { usePolicySources } from '../features/questions/usePolicySources'
import { useTestSets, useTestSetVersion } from '../features/questions/useTestSets'
import { DraftModal, StartChoices, TypeGuide, useCsvPicker } from '../features/questions/StartSources'
import { ReviewFlow, ReviewView, type ReviewAction } from '../features/questions/ReviewView'
import { PrimaryAction, StageFooter, StageHeader } from '../features/stage/StageUI'
import styles from './QuestionSetPage.module.css'

/** 새 시험지 이름. 프로젝트마다 시험지 하나를 버전으로 관리합니다. */
const TEST_SET_NAME = '시험지'

type QuestionSetPageProps = {
  projectId: string
  /** 시험지를 확정했거나, 이미 확정된 시험지에서 다음으로 넘어갈 때 */
  onConfirm?: () => void
  onBack?: () => void
}

/** 1단계 · 시험지 만들기 (05 시작 화면 → 문제 검토) */
export default function QuestionSetPage({ projectId, onConfirm, onBack }: QuestionSetPageProps) {
  const toast = useToast()
  // 시험지를 만들거나 확정하면 사이드바 요약(시험지 상태 · 열린 단계)도 다시 불러옴
  const refreshSummary = useProjectNav()?.current?.reload

  // 프로젝트의 시험지(가장 최근 것)와 그 최신 버전
  const testSets = useTestSets(projectId)
  const testSet = testSets.items[0]
  const detail = useApiQuery(
    (signal) => (testSet ? getTestSet(projectId, testSet.id, { signal }) : Promise.resolve(null)),
    [projectId, testSet?.id],
  )
  const set = useTestSetVersion(projectId, testSet?.id, detail.data?.version.id)
  const version = set.version
  const readOnly = version?.status === 'confirmed'

  const policies = usePolicySources(projectId, version?.policyVersionIds ?? [])
  const questions = useMemo(
    () => version?.questions.map((q) => toQuestion(q, policies.optionMap)) ?? [],
    [version, policies.optionMap],
  )

  const [docs, setDocs] = useState<string[] | null>(null)
  const [counts, setCounts] = useState<DraftCounts>(DEFAULT_DRAFT_COUNTS)
  const [generating, setGenerating] = useState(false)
  const [draftError, setDraftError] = useState<string>()
  const [draftOpen, setDraftOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<{ text: string; error?: boolean }>()

  // 문서 선택: 시험지가 있으면 그 시험지를 만들 때 고른 문서(바꿀 수 없음), 없으면 사용자가 고른 문서(처음엔 전체)
  const docOptions = version
    ? version.policyVersionIds.map((id) => ({ value: id, label: policies.names.get(id) ?? '정책 문서' }))
    : policies.sources.map((s) => ({ value: s.latestVersionId, label: s.name }))
  const usedDocs = version ? version.policyVersionIds : (docs ?? docOptions.map((o) => o.value))

  const tally = useMemo(
    () => ({
      approved: questions.filter((q) => q.status === 'approved').length,
      deleted: questions.filter((q) => q.status === 'deleted').length,
      pending: questions.filter((q) => q.status === 'pending').length,
    }),
    [questions],
  )

  /** 다른 사람이 먼저 바꿨으면(409 · 412) 최신 상태를 다시 받음 */
  function fail(error: unknown, fallback: string) {
    if (isApiError(error) && (error.status === 409 || error.status === 412)) set.reload()
    toast.error(errorMessage(error, fallback))
  }

  /** 시험지가 없으면 고른 정책 문서로 만들고, 문제를 넣을 draft 버전을 돌려줌 */
  async function draftVersion(policyVersionIds: string[]): Promise<{ testSetId: string; version: TestSetVersion }> {
    if (testSet && version) return { testSetId: testSet.id, version }
    if (policyVersionIds.length === 0) throw new RangeError('정책 문서가 없습니다. 프로젝트 설정에서 정책 문서를 먼저 올려 주세요.')
    const created = await testSets.create({ name: TEST_SET_NAME, policyVersionIds })
    refreshSummary?.()
    return { testSetId: created.testSet.id, version: created.version }
  }

  /** 새로 만든 시험지면 목록 → 상세 → 버전 순으로 다시 불러오고, 기존 시험지면 받은 버전으로 바로 바꿈 */
  function show(next: TestSetVersion) {
    if (version && next.id === version.id) set.setVersion(next)
    else detail.reload()
  }

  async function runDraft() {
    setGenerating(true)
    setDraftError(undefined)
    try {
      const { testSetId, version: target } = await draftVersion(usedDocs)
      const categoryCounts = Object.fromEntries(QUESTION_TYPES.filter((t) => counts[t] > 0).map((t) => [CATEGORY_OF[t], counts[t]]))
      const next = await generateQuestions(projectId, testSetId, target.id, { expectedRevision: target.revision, categoryCounts })
      show(next)
      setDraftOpen(false)
      toast.success('문제를 만들었습니다. 하나씩 검토해 주세요.')
    } catch (error) {
      if (isApiError(error) && (error.status === 409 || error.status === 412)) set.reload()
      setDraftError(errorMessage(error, '문제를 만들지 못했습니다.'))
    } finally {
      setGenerating(false)
    }
  }

  async function uploadCsv([file]: File[]) {
    setUploadMessage(undefined)
    if (file.size > CSV_RULES.maxBytes) return setUploadMessage({ text: 'CSV 파일은 2MB까지 올릴 수 있습니다.', error: true })
    try {
      const { testSetId, version: target } = await draftVersion(usedDocs)
      const before = target.questions.length
      const next = await importQuestionsCsv(projectId, testSetId, target.id, file, target.revision)
      show(next)
      setUploadMessage({ text: `${file.name}에서 질문 ${next.questions.length - before}개를 가져왔습니다. 근거를 연결한 뒤 승인해 주세요.` })
    } catch (error) {
      if (isApiError(error) && (error.status === 409 || error.status === 412)) set.reload()
      // 행별 오류가 오면 앞의 몇 개만 보여줌
      const rows = isApiError(error) ? error.fieldErrors.slice(0, 3).map((f) => f.message) : []
      setUploadMessage({ text: [errorMessage(error, 'CSV를 가져오지 못했습니다.'), ...rows].join(' · '), error: true })
    }
  }

  async function act(id: string, action: ReviewAction) {
    const question = questions.find((q) => q.id === id)
    if (!question) return
    setBusyId(id)
    try {
      if (action === 'approve') await set.review(id, 'approved')
      else if (action === 'delete') await set.review(id, 'rejected')
      // 서버에는 "검토 전으로 되돌리기"가 없어서, 같은 내용으로 다시 저장하면 미검토로 돌아가는 규칙을 씀
      else await set.edit(id, inputOf(question.raw))
    } catch (error) {
      fail(error, '처리하지 못했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  async function saveEdit(id: string, edit: QuestionEdit) {
    const question = questions.find((q) => q.id === id)
    if (!question) return
    setBusyId(id)
    try {
      await set.edit(id, editInput(question.raw, edit, policies.optionMap))
      setEditingId(null)
    } catch (error) {
      fail(error, '질문을 저장하지 못했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  async function removeQuestion(id: string) {
    setBusyId(id)
    try {
      await set.remove(id)
      setEditingId(null)
    } catch (error) {
      fail(error, '질문을 삭제하지 못했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  /** 삭제(반려)한 질문은 확정할 수 없어서 지운 뒤 확정합니다. 삭제는 응답이 없어 매번 버전을 다시 받아 revision을 맞춤 */
  async function confirm() {
    if (!testSet || !version) return
    setConfirming(true)
    try {
      let current = version
      for (const q of current.questions.filter((q) => q.reviewStatus === 'rejected')) {
        await deleteQuestion(projectId, testSet.id, current.id, q.id, current.revision)
        current = await getTestSetVersion(projectId, testSet.id, current.id)
      }
      const confirmed = await confirmTestSetVersion(projectId, testSet.id, current.id, current.revision)
      set.setVersion(confirmed)
      setConfirmOpen(false)
      refreshSummary?.()
      toast.success(`시험지 v${confirmed.version}를 확정했습니다.`)
      onConfirm?.()
    } catch (error) {
      fail(error, '시험지를 확정하지 못했습니다.')
    } finally {
      setConfirming(false)
    }
  }

  /** 확정된 시험지를 고치려면 복사해서 새 draft 버전을 만듦 */
  async function newDraft() {
    if (!testSet || !version) return
    try {
      await createTestSetDraft(projectId, testSet.id, { expectedRevision: testSet.revision, sourceVersionId: version.id })
      testSets.reload()
      toast.success('새 버전을 만들었습니다. 고친 뒤 다시 확정해 주세요.')
    } catch (error) {
      if (isApiError(error) && (error.status === 409 || error.status === 412)) testSets.reload()
      toast.error(errorMessage(error, '새 버전을 만들지 못했습니다.'))
    }
  }

  const csv = useCsvPicker(uploadCsv)
  const loadError = testSets.error ?? detail.error ?? set.error ?? policies.error
  const loading = testSets.loading || (testSet && !version && !loadError)
  const empty = !loading && questions.length === 0
  const reviewed = questions.length - tally.pending
  const canConfirm = !readOnly && tally.pending === 0 && tally.approved > 0

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          questionSet={
            version ? `v${version.version} · ${questions.length}문항${readOnly ? '' : ' (검토 중)'}` : '없음'
          }
          current={ROUTES.questions}
          onBack={onBack}
        />
      }
      footer={
        !empty &&
        !loading && (
          <StageFooter
            actions={
              readOnly ? (
                <PrimaryAction onClick={() => onConfirm?.()}>응시로 이동</PrimaryAction>
              ) : (
                <PrimaryAction disabled={!canConfirm || confirming} onClick={() => setConfirmOpen(true)}>
                  확정하고 응시 시작
                </PrimaryAction>
              )
            }
          >
            <span>
              {readOnly ? `확정됨 · 승인 ${tally.approved}문항` : `검토 ${reviewed} / ${questions.length}`}
            </span>
            <span className={styles.progress}>
              <span style={{ width: `${questions.length ? (reviewed / questions.length) * 100 : 0}%` }} />
            </span>
          </StageFooter>
        )
      }
    >
      <div className={styles.page}>
        <StageHeader title="시험지 만들기" aside={<ReviewFlow step={empty ? 1 : canConfirm || readOnly ? 3 : 2} />} />
        {loadError ? (
          <ErrorNotice
            error={loadError}
            title="시험지를 불러오지 못했습니다"
            onRetry={() => {
              testSets.reload()
              detail.reload()
              set.reload()
              policies.reload()
            }}
          />
        ) : loading ? null : (
          <>
            {empty && <p className={styles.lead}>어떻게 문제를 넣을까요?</p>}
            {readOnly && (
              <p className={styles.message} role="status">
                확정된 시험지 v{version?.version}입니다. 고치려면{' '}
                <Button variant="tonal" size="xxs" onClick={newDraft}>
                  새 버전 만들기
                </Button>
              </p>
            )}
            {csv.input}
            {uploadMessage && (
              <p className={uploadMessage.error ? styles.error : styles.message} role={uploadMessage.error ? 'alert' : 'status'}>
                {uploadMessage.text}
              </p>
            )}
            {empty ? (
              <>
                <StartChoices onDraft={() => setDraftOpen(true)} onUpload={csv.open} />
                <TypeGuide />
              </>
            ) : (
              <ReviewView
                questions={questions}
                onAction={act}
                busyId={busyId}
                readOnly={readOnly}
                onEdit={(q) => setEditingId(q.id)}
                onDraft={() => setDraftOpen(true)}
                onUpload={csv.open}
              />
            )}
          </>
        )}
      </div>

      <DraftModal
        open={draftOpen}
        onClose={() => {
          setDraftOpen(false)
          setDraftError(undefined)
        }}
        docOptions={docOptions}
        docs={usedDocs}
        onDocsChange={setDocs}
        docsLocked={Boolean(version)}
        counts={counts}
        onCountsChange={setCounts}
        generating={generating}
        onGenerate={runDraft}
        error={
          draftError ??
          (docOptions.length === 0 ? '정책 문서가 없습니다. 프로젝트 설정 > 프롬프트 · 문서에서 먼저 올려 주세요.' : undefined)
        }
      />

      <ConfirmSetModal
        open={confirmOpen}
        onClose={() => !confirming && setConfirmOpen(false)}
        version={`v${version?.version ?? 1}`}
        approved={tally.approved}
        deleted={tally.deleted}
        unlabeled={questions.filter((q) => q.status === 'approved' && q.evidence.length === 0).length}
        onConfirm={confirm}
      />

      <QuestionEditModal
        question={questions.find((q) => q.id === editingId) ?? null}
        evidenceOptions={policies.options}
        saving={busyId === editingId}
        onClose={() => setEditingId(null)}
        onSave={saveEdit}
        onDelete={removeQuestion}
      />
    </AppLayout>
  )
}

