import { useMemo, useState } from 'react'
import { ProjectSidebar } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { ROUTES } from '../routes'
import { generateDraft } from '../features/questions/api'
import { questionsFromCsv } from '../features/questions/csv'
import { MOCK_CHUNK_OPTIONS, MOCK_DOC_OPTIONS, MOCK_DRAFT_COUNTS } from '../features/questions/mock'
import { QuestionEditModal } from '../features/questions/QuestionEditModal'
import { ConfirmSetModal } from '../features/questions/ConfirmSetModal'
import type { Question } from '../features/questions/types'
import { DraftModal, StartChoices, TypeGuide, useCsvPicker } from '../features/questions/StartSources'
import { ReviewFlow, ReviewView } from '../features/questions/ReviewView'
import { PrimaryAction, StageFooter, StageHeader } from '../features/stage/StageUI'
import styles from './QuestionSetPage.module.css'

const user = { name: '김QA', role: '어드민' }

type QuestionSetPageProps = {
  projectName?: string
  /** 확정할 질문 세트 버전 */
  setVersion?: string
  initialQuestions?: Question[]
  onConfirm?: (approved: Question[]) => void
  onBack?: () => void
}

/** 1단계 · 시험지 만들기 (05 시작 화면 → 문제 검토) */
export default function QuestionSetPage({
  projectName = '모아몰 CS 챗봇',
  setVersion = 'v1',
  initialQuestions = [],
  onConfirm,
  onBack,
}: QuestionSetPageProps) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [docs, setDocs] = useState(['refund', 'shipping', 'order'])
  const [counts, setCounts] = useState(MOCK_DRAFT_COUNTS)
  const [generating, setGenerating] = useState(false)
  const [draftOpen, setDraftOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<{ text: string; error?: boolean }>()

  const tally = useMemo(
    () => ({
      approved: questions.filter((q) => q.status === 'approved').length,
      deleted: questions.filter((q) => q.status === 'deleted').length,
      pending: questions.filter((q) => q.status === 'pending').length,
    }),
    [questions],
  )

  const patch = (id: string, change: Partial<Question>) =>
    setQuestions((list) => list.map((q) => (q.id === id ? { ...q, ...change } : q)))

  const uploadCsv = async ([file]: File[]) => {
    const { questions: imported, error } = questionsFromCsv(await file.text())
    if (error) return setUploadMessage({ text: error, error: true })
    setQuestions((list) => [...imported, ...list])
    setUploadMessage({ text: `${file.name}에서 질문 ${imported.length}개를 미검토로 추가했습니다.` })
  }

  const runDraft = async () => {
    setGenerating(true)
    try {
      const names = MOCK_DOC_OPTIONS.filter((o) => docs.includes(o.value)).map((o) => o.label)
      const drafted = await generateDraft(names, counts)
      setQuestions((list) => [...drafted, ...list])
      setDraftOpen(false)
    } finally {
      setGenerating(false)
    }
  }

  const canConfirm = tally.pending === 0 && tally.approved > 0
  const csv = useCsvPicker(uploadCsv)
  const empty = questions.length === 0
  const reviewed = questions.length - tally.pending

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          user={user}
          projectName={projectName}
          promptOptions={[{ value: 'v1', label: 'v1 (초안)' }]}
          promptValue="v1"
          onPromptChange={() => {}}
          questionSet={empty ? '없음' : '검토 중'}
          current={ROUTES.questions}
          onBack={onBack}
        />
      }
      footer={
        !empty && (
          <StageFooter
            actions={
              <PrimaryAction disabled={!canConfirm} onClick={() => setConfirmOpen(true)}>
                확정하고 응시 시작
              </PrimaryAction>
            }
          >
            <span>
              검토 {reviewed} / {questions.length}
            </span>
            <span className={styles.progress}>
              <span style={{ width: `${(reviewed / questions.length) * 100}%` }} />
            </span>
          </StageFooter>
        )
      }
    >
      <div className={styles.page}>
        <StageHeader title="시험지 만들기" aside={<ReviewFlow step={empty ? 1 : canConfirm ? 3 : 2} />} />
        {empty && <p className={styles.lead}>어떻게 문제를 넣을까요?</p>}
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
            onPatch={patch}
            onEdit={(q) => setEditingId(q.id)}
            onDraft={() => setDraftOpen(true)}
            onUpload={csv.open}
          />
        )}
      </div>

      <DraftModal
        open={draftOpen}
        onClose={() => setDraftOpen(false)}
        docOptions={MOCK_DOC_OPTIONS}
        docs={docs}
        onDocsChange={setDocs}
        counts={counts}
        onCountsChange={setCounts}
        generating={generating}
        onGenerate={runDraft}
      />

      <ConfirmSetModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        version={setVersion}
        approved={tally.approved}
        deleted={tally.deleted}
        unlabeled={questions.filter((q) => q.status === 'approved' && q.chunks.length === 0).length}
        onConfirm={() => {
          setConfirmOpen(false)
          onConfirm?.(questions.filter((q) => q.status === 'approved'))
        }}
      />

      <QuestionEditModal
        question={questions.find((q) => q.id === editingId) ?? null}
        chunkOptions={MOCK_CHUNK_OPTIONS}
        onClose={() => setEditingId(null)}
        onSave={(id, change) => {
          patch(id, change)
          setEditingId(null)
        }}
        onDelete={(id) => {
          patch(id, { status: 'deleted' })
          setEditingId(null)
        }}
      />
    </AppLayout>
  )
}
