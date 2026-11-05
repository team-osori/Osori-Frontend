import { useMemo, useState } from 'react'
import { Button, FilterChips, SearchInput } from '../components/ui'
import { ActionBar, PageHeader, ProjectSidebar } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { ROUTES } from '../routes'
import { generateDraft } from '../features/questions/api'
import { questionsFromCsv } from '../features/questions/csv'
import { MOCK_CHUNK_OPTIONS, MOCK_DOC_OPTIONS, MOCK_DRAFT_COUNTS } from '../features/questions/mock'
import { QuestionEditModal } from '../features/questions/QuestionEditModal'
import { ConfirmSetModal } from '../features/questions/ConfirmSetModal'
import type { Question } from '../features/questions/types'
import { DraftModal, StartChoices, TypeGuide, useCsvPicker } from '../features/questions/StartSources'
import { QuestionTable } from '../features/questions/QuestionTable'
import questionStyles from '../features/questions/questions.module.css'
import styles from './QuestionSetPage.module.css'

const user = { name: '김QA', role: '어드민' }

type Filter = 'all' | 'pending' | 'upload' | 'ai'

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
  const [filter, setFilter] = useState<Filter>('all')
  const [keyword, setKeyword] = useState('')
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

  const visible = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    return questions.filter((q) => {
      if (filter === 'pending' && q.status !== 'pending') return false
      if (filter === 'upload' && q.source !== '직접 업로드') return false
      if (filter === 'ai' && q.source !== 'AI 초안') return false
      return !k || q.text.toLowerCase().includes(k) || q.expected.toLowerCase().includes(k)
    })
  }, [questions, filter, keyword])

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
      setFilter('pending')
      setDraftOpen(false)
    } finally {
      setGenerating(false)
    }
  }

  const canConfirm = tally.pending === 0 && tally.approved > 0
  const csv = useCsvPicker(uploadCsv)
  const empty = questions.length === 0

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          user={user}
          projectName={projectName}
          promptOptions={[{ value: 'v1', label: 'v1 (초안)' }]}
          promptValue="v1"
          onPromptChange={() => {}}
          questionSet={empty ? '없음' : `작성 중 · ${questions.length}문항`}
          current={ROUTES.questions}
          onBack={onBack}
        />
      }
      footer={
        !empty && (
        <ActionBar
          status={[
            { tone: 'success', label: `승인 ${tally.approved}` },
            { tone: 'danger', label: `삭제 ${tally.deleted}` },
            { tone: 'muted', label: `미검토 ${tally.pending}` },
          ]}
          hint={canConfirm ? undefined : tally.pending ? '미검토 질문을 모두 처리하면 확정할 수 있습니다' : '승인한 질문이 있어야 확정할 수 있습니다'}
        >
          <Button
            disabled={!canConfirm}
            onClick={() => setConfirmOpen(true)}
          >
            시험지 {setVersion}로 확정
          </Button>
        </ActionBar>
        )
      }
    >
      <div className={styles.page}>
        <PageHeader
          title="시험지 만들기"
          description={empty ? '어떻게 문제를 넣을까요?' : '문제를 하나씩 보고 승인하거나 고치세요.'}
          actions={
            !empty && (
              <>
                <Button size="xs" variant="tonal" icon="upload" onClick={csv.open}>
                  CSV 올리기
                </Button>
                <Button size="xs" icon="sparkleSm" onClick={() => setDraftOpen(true)}>
                  문서로 더 만들기
                </Button>
              </>
            )
          }
        />
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
        <section className={styles.list} aria-label="질문 목록">
          <div className={questionStyles.toolbar}>
            <h2 className={questionStyles.count}>문제 {questions.length}</h2>
            <FilterChips
              ariaLabel="질문 필터"
              value={filter}
              onChange={setFilter}
              items={[
                { value: 'all', label: '전체' },
                { value: 'pending', label: `미검토 ${tally.pending}` },
                { value: 'upload', label: '직접 업로드' },
                { value: 'ai', label: 'AI 초안' },
              ]}
            />
            <SearchInput
              size="sm"
              placeholder="문제 검색"
              className={questionStyles.search}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <QuestionTable
            questions={visible}
            onApprove={(id, approved) => patch(id, { status: approved ? 'approved' : 'pending' })}
            onDelete={(id) => patch(id, { status: 'deleted' })}
            onRestore={(id) => patch(id, { status: 'pending' })}
            onEdit={(q) => setEditingId(q.id)}
          />
        </section>
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
