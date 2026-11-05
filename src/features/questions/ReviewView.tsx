import { useEffect, useMemo, useState } from 'react'
import { Sticker } from '../../components/ui'
import { cx } from '../../lib/cx'
import checkIcon from '../../assets/icons/stage/check.svg'
import pencilIcon from '../../assets/icons/stage/pencil.svg'
import searchIcon from '../../assets/icons/stage/search.svg'
import sparkleIcon from '../../assets/icons/stage/sparkle.svg'
import trashIcon from '../../assets/icons/stage/trash.svg'
import uploadIcon from '../../assets/icons/stage/upload.svg'
import warningIcon from '../../assets/icons/stage/warning.svg'
import { CountTabs, Dot, Pager, Pill, SecondaryAction, StageCard, Well } from '../stage/StageUI'
import { QUESTION_TYPES, type Question, type QuestionStatus } from './types'

/** 처리 버튼을 누를 때 화면이 부르는 동작. 서버 요청이 끝나면 목록이 바뀜 */
export type ReviewAction = 'approve' | 'unapprove' | 'delete' | 'restore'
import styles from './review.module.css'

type Tab = 'pending' | 'all' | 'approved' | 'deleted'

const STATUS: Record<QuestionStatus, { label: string; color: string }> = {
  pending: { label: '검토 필요', color: 'var(--color-review)' },
  approved: { label: '승인됨', color: 'var(--color-correct)' },
  deleted: { label: '삭제됨', color: 'var(--color-wrong)' },
}

type ReviewViewProps = {
  questions: Question[]
  onAction: (id: string, action: ReviewAction) => void
  /** 요청 중인 질문. 버튼을 잠금 */
  busyId?: string | null
  /** 확정된 시험지는 고칠 수 없음 */
  readOnly?: boolean
  onEdit: (question: Question) => void
  onDraft: () => void
  onUpload: () => void
}

/** 06 시험지 · 검토: 문제를 한 장씩 넘기며 승인 · 수정 · 삭제 */
export function ReviewView({ questions, onAction, busyId, readOnly = false, onEdit, onDraft, onUpload }: ReviewViewProps) {
  const [tab, setTab] = useState<Tab>('all')
  const [keyword, setKeyword] = useState('')
  const [index, setIndex] = useState(0)

  const counts = useMemo(
    () => ({
      pending: questions.filter((q) => q.status === 'pending').length,
      all: questions.length,
      approved: questions.filter((q) => q.status === 'approved').length,
      deleted: questions.filter((q) => q.status === 'deleted').length,
    }),
    [questions],
  )

  const list = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    return questions.filter(
      (q) => (tab === 'all' || q.status === tab) && (!k || q.text.toLowerCase().includes(k) || q.expected.toLowerCase().includes(k)),
    )
  }, [questions, tab, keyword])

  // 탭 · 검색이 바뀌면 처음부터, 목록이 줄면 범위 안으로
  useEffect(() => setIndex(0), [tab, keyword])
  const current = Math.min(index, Math.max(0, list.length - 1))
  const question = list[current]

  /** 처리 후 다음 검토 필요 문제로 */
  const settle = (id: string, action: ReviewAction) => {
    onAction(id, action)
    if (tab !== 'all') return // 검토 필요 탭 등은 목록에서 빠지며 자연히 다음 문제가 보임
    const next = list.findIndex((q, i) => i > current && q.status === 'pending')
    if (next !== -1) setIndex(next)
  }

  const byType = QUESTION_TYPES.map((type) => ({
    type,
    count: questions.filter((q) => q.typeLabel === type && q.status !== 'deleted').length,
  }))
  const active = questions.filter((q) => q.status !== 'deleted').length
  const maxType = Math.max(1, ...byType.map((t) => t.count))
  const unlabeled = questions.filter((q) => q.status !== 'deleted' && q.evidence.length === 0).length

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <CountTabs
          label="문제 상태"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'pending', label: '검토 필요', count: counts.pending },
            { value: 'all', label: '전체', count: counts.all },
            { value: 'approved', label: '승인', count: counts.approved },
            { value: 'deleted', label: '삭제', count: counts.deleted },
          ]}
          aside={
            <label className={styles.search}>
              <img src={searchIcon} alt="" width={18} height={18} />
              <input type="search" placeholder="질문 검색" aria-label="질문 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </label>
          }
        />

        {question ? (
          <StageCard
            className={styles.card}
            decoration={<Sticker name="binderClip" width={84} rot={6} motion="pop" delay={200} />}
          >
            <div key={question.id} className={styles.cardBody} data-motion="rise">
              <div className={styles.meta}>
                <span className={styles.number}>
                  <b>{current + 1}</b> / {list.length}
                </span>
                <span className={styles.divider} aria-hidden />
                <Pill>{question.typeLabel}</Pill>
                <Pill className={styles.status} dot={<Dot color={STATUS[question.status].color} />}>
                  {STATUS[question.status].label}
                </Pill>
              </div>

              <h2 className={cx(styles.question, question.status === 'deleted' && styles.struck)}>{question.text}</h2>

              <Well label="모범 답안" className={styles.answer}>
                <p className={styles.expected}>
                  {question.evidenceLabels.length > 0 ? (
                    <span className={styles.grounded} title={`근거: ${question.evidenceLabels.join(', ')}`} tabIndex={0}>
                      {question.expected}
                      <span className={styles.tooltip} role="tooltip">
                        근거 · {question.evidenceLabels.join(', ')}
                      </span>
                    </span>
                  ) : (
                    question.expected
                  )}
                </p>
                <p className={styles.hint}>
                  {question.evidenceLabels.length > 0 ? (
                    <>
                      <span className={styles.hintLine} aria-hidden />
                      밑줄에 마우스를 올리면 근거 문서가 보입니다
                    </>
                  ) : (
                    <>
                      <img src={warningIcon} alt="" width={14} height={14} />
                      근거가 연결되지 않아 승인할 수 없습니다. 수정에서 연결해 주세요.
                    </>
                  )}
                </p>
              </Well>

              {!readOnly && <div className={styles.actions}>
                {question.status === 'deleted' ? (
                  <button type="button" className={styles.restore} disabled={busyId === question.id} onClick={() => settle(question.id, 'restore')}>
                    되살리기
                  </button>
                ) : (
                  <button type="button" className={styles.delete} disabled={busyId === question.id} onClick={() => settle(question.id, 'delete')}>
                    <img src={trashIcon} alt="" width={18} height={18} />
                    삭제
                  </button>
                )}
                <span className={styles.spacer} />
                <button type="button" className={styles.edit} disabled={busyId === question.id} onClick={() => onEdit(question)}>
                  <img src={pencilIcon} alt="" width={18} height={18} />
                  수정
                </button>
                <button
                  type="button"
                  className={cx(styles.approve, question.status === 'approved' && styles.approved)}
                  onClick={() => settle(question.id, question.status === 'approved' ? 'unapprove' : 'approve')}
                  disabled={question.status === 'deleted' || busyId === question.id || (question.status !== 'approved' && question.evidence.length === 0)}
                  title={question.evidence.length === 0 ? '근거를 연결해야 승인할 수 있습니다' : undefined}
                >
                  <img src={checkIcon} alt="" width={20} height={20} />
                  {question.status === 'approved' ? '승인됨' : '승인'}
                </button>
              </div>}
            </div>
          </StageCard>
        ) : (
          <StageCard className={styles.emptyCard}>
            <p>{keyword.trim() ? `'${keyword.trim()}'와 맞는 문제가 없습니다.` : '이 상태의 문제가 없습니다.'}</p>
          </StageCard>
        )}

        {list.length > 0 && (
          <Pager
            label="문제 번호"
            current={current}
            onChange={setIndex}
            items={list.map((q, i) => ({
              id: q.id,
              label: String(i + 1),
              dim: q.status !== 'pending',
              marker: <Dot color={STATUS[q.status].color} size={6} />,
            }))}
          />
        )}
      </div>

      <aside className={styles.side} aria-label="질문 구성">
        <h2 className={styles.sideTitle}>질문 구성 · {active}개</h2>
        <ul className={styles.types}>
          {byType.map(({ type, count }) => (
            <li key={type} className={styles.typeRow}>
              <span className={styles.typeName}>{type}</span>
              <span className={styles.typeTrack}>
                <span className={styles.typeFill} data-motion="fill" style={{ width: `${(count / maxType) * 100}%` }} />
              </span>
              <b className={styles.typeCount}>{count}</b>
            </li>
          ))}
        </ul>
        <hr className={styles.rule} />
        {unlabeled > 0 && (
          <p className={styles.warn}>
            <img src={warningIcon} alt="" width={18} height={18} />
            근거 없는 질문 {unlabeled}개
          </p>
        )}
        {!readOnly && <div className={styles.sideActions}>
          <SecondaryAction icon={sparkleIcon} onClick={onDraft}>
            AI로 더 만들기
          </SecondaryAction>
          <SecondaryAction icon={uploadIcon} onClick={onUpload}>
            CSV 올리기
          </SecondaryAction>
        </div>}
      </aside>
    </div>
  )
}

/** 06 머리: 문제 내기 ✓ — 검토 — 확정 */
export function ReviewFlow({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['문제 내기', '검토', '확정']
  return (
    <ol className={styles.flow} aria-label="시험지 만들기 단계">
      {steps.map((label, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'current' : 'todo'
        return (
          <li key={label} className={cx(styles.flowStep, styles[state])} aria-current={state === 'current' ? 'step' : undefined}>
            <span className={styles.flowMarker} aria-hidden>
              {state === 'done' ? '✓' : n}
            </span>
            {label}
          </li>
        )
      })}
    </ol>
  )
}
