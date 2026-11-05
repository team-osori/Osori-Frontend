import { useMemo, useState } from 'react'
import { ProjectSidebar } from '../components/common'
import { Sticker } from '../components/ui'
import { cx } from '../lib/cx'
import { AppLayout } from '../layouts/AppLayout'
import { ROUTES } from '../routes'
import chevronIcon from '../assets/icons/stage/chevron-right.svg'
import chevronSmIcon from '../assets/icons/stage/chevron-right-sm.svg'
import trendIcon from '../assets/icons/stage/trend-arrow.svg'
import { CAUSE, MOCK_APPLIED, MOCK_WRONG_ITEMS, type WhyPart, type WrongCause, type WrongItem } from '../features/wrongNotes/mock'
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
  projectName?: string
  nextVersion?: string
  initialItems?: WrongItem[]
  /** 고친 프롬프트로 다시 채점 */
  onRetest?: (applied: string[]) => void
  onSave?: (applied: string[]) => void
}

/** 08 3단계 · 오답 노트: 틀린 이유를 보고 프롬프트를 고쳐 다시 시험 */
export default function WrongNotesPage({
  projectName = '모아몰 CS 챗봇',
  nextVersion = 'v4',
  initialItems = MOCK_WRONG_ITEMS,
  onRetest,
  onSave,
}: WrongNotesPageProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [index, setIndex] = useState(2)
  const [open, setOpen] = useState(false)
  const [full, setFull] = useState(false)
  const [applied, setApplied] = useState<string[]>(MOCK_APPLIED)
  const [saved, setSaved] = useState(false)

  const list = useMemo(() => initialItems.filter((i) => filter === 'all' || i.cause === filter), [initialItems, filter])
  // 탭을 바꾸면 처음 문항부터
  const changeFilter = (next: Filter) => {
    setFilter(next)
    setIndex(0)
    setOpen(false)
    setFull(false)
  }
  const current = Math.min(index, list.length - 1)
  const item = list[current]

  const count = (cause: WrongCause) => initialItems.filter((i) => i.cause === cause).length
  const solved = initialItems.filter((i) => applied.includes(i.id)).reduce((sum, i) => sum + (i.suggestion?.solves ?? 0), 0)
  const expected = initialItems.length - solved

  const toggleApply = (id: string) => {
    setApplied((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
    setSaved(false)
  }

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          projectName={projectName}
          promptOptions={[{ value: 'v3', label: 'v3 (최신)' }]}
          promptValue="v3"
          onPromptChange={() => {}}
          questionSet="v1 · 67문항"
          current={ROUTES.wrongNotes}
          stageNotes={{ 1: 'v1 · 67문항 확정', 2: '18 / 18 채점' }}
          unlockedUntil={3}
        />
      }
      footer={
        <StageFooter
          actions={
            <>
              <SecondaryAction
                onClick={() => {
                  setSaved(true)
                  onSave?.(applied)
                }}
              >
                {saved ? `${nextVersion} 저장됨` : `${nextVersion} 저장만`}
              </SecondaryAction>
              <PrimaryAction disabled={applied.length === 0} onClick={() => onRetest?.(applied)}>
                {nextVersion}로 재시험
              </PrimaryAction>
            </>
          }
        >
          <span>
            수정 제안 <b>{applied.length}개</b> 적용됨
          </span>
        </StageFooter>
      }
    >
      <div className={styles.page}>
        <StageHeader
          title="오답 노트"
          aside={
            <div className={styles.forecast} aria-label={`틀린 문항 ${initialItems.length}개에서 ${expected}개로 줄 것으로 예상`}>
              <span className={styles.forecastLabel}>틀린 문항</span>
              <span className={styles.wrongCount}>
                <i aria-hidden>✕</i>
                <b>{initialItems.length}</b>
              </span>
              <img src={trendIcon} alt="" width={18} height={18} />
              <span className={styles.wrongCount}>
                <i aria-hidden>✕</i>
                <b key={expected} data-motion="pop">
                  {expected}
                </b>
              </span>
              <span className={styles.forecastHint}>예상</span>
            </div>
          }
        />

        <CountTabs
          label="틀린 원인"
          value={filter}
          onChange={changeFilter}
          items={[
            { value: 'all', label: '전체', count: initialItems.length },
            ...(['prompt', 'search', 'model'] as const).map((c) => ({
              value: c,
              label: CAUSE[c].label,
              count: count(c),
              dot: <Dot color={CAUSE[c].color} shape={CAUSE[c].shape} size={10} />,
            })),
          ]}
        />

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
                <Pill dot={<Dot color={CAUSE[item.cause].color} shape={CAUSE[item.cause].shape} size={10} />}>
                  {CAUSE[item.cause].label}
                </Pill>
                <Pill className={styles.fixable} dot={<Dot color={item.suggestion ? 'var(--color-correct)' : 'var(--color-pending)'} />}>
                  {item.suggestion ? '고칠 수 있음' : '프롬프트로 못 고침'}
                </Pill>
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
                <p className={cx(styles.answerText, full && styles.answerFull)}>{item.answer}</p>
              </Well>

              <section className={styles.why}>
                <SectionLabel>왜 틀렸나</SectionLabel>
                <p className={styles.whyText}>
                  {item.why.map((part, i) => (part.mark ? <WhyMark key={i} part={part} id={`${item.id}-why-${i}`} /> : <span key={i}>{part.text}</span>))}
                </p>
              </section>

              {item.suggestion ? (
                <div className={cx(styles.suggest, open && styles.suggestOpen)}>
                  <button type="button" className={styles.suggestHead} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
                    <Sticker name="sparkle" width={18} />
                    <span className={styles.suggestTitle}>수정 제안 보기</span>
                    <Pill dot={<i className={styles.pillCross}>✕</i>}>{item.suggestion.solves}문항 해결</Pill>
                    <img src={chevronIcon} alt="" width={20} height={20} className={cx(styles.chevron, open && styles.chevronOpen)} />
                  </button>
                  {open && (
                    <div className={styles.suggestBody}>
                      <div className={styles.diff}>
                        <p className={styles.del}>
                          <span aria-hidden>−</span>
                          {item.suggestion.remove}
                        </p>
                        <p className={styles.ins}>
                          <span aria-hidden>+</span>
                          {item.suggestion.add}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={cx(styles.apply, applied.includes(item.id) && styles.applied)}
                        onClick={() => toggleApply(item.id)}
                        aria-pressed={applied.includes(item.id)}
                      >
                        {applied.includes(item.id) ? `✓ ${nextVersion}에 적용됨` : `${nextVersion}에 적용`}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className={styles.notFixable}>
                  {item.cause === 'search'
                    ? '프롬프트가 아니라 검색 설정(문서 색인 · 조각 크기)을 확인해야 해요.'
                    : '같은 질문을 여러 번 돌려 보거나 다른 모델과 비교해 보세요.'}
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
            marker: <Dot color={CAUSE[w.cause].color} shape={CAUSE[w.cause].shape} size={8} />,
          }))}
        />
      </div>
    </AppLayout>
  )
}

/** 문서 · 말풍선 아이콘 (글자색을 따라감) */
const SOURCE_ICON = {
  doc: (
    <svg width="14" height="14" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8.1 1.1H3.3a1.1 1.1 0 0 0-1.1 1.1v8.6a1.1 1.1 0 0 0 1.1 1.1h6.4a1.1 1.1 0 0 0 1.1-1.1V3.8L8.1 1.1Z" />
      <path d="M7.6 1.1v2.2a1.1 1.1 0 0 0 1.1 1h2.1M5.4 4.9H4.3M8.7 7H4.3M8.7 9.2H4.3" />
    </svg>
  ),
  prompt: (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13.1 9.4a1.3 1.3 0 0 1-1.2 1.2H4.4l-2.5 2.5v-10a1.3 1.3 0 0 1 1.2-1.2h8.8a1.3 1.3 0 0 1 1.2 1.2v6.3Z" />
      <path d="M8.1 5H4.4M10.6 7.5H4.4" />
    </svg>
  ),
}

/** 왜 틀렸나의 형광 표시. 원문이 있으면 마우스를 올리거나 포커스하면 위에 원문 말풍선이 뜸 */
function WhyMark({ part, id }: { part: WhyPart; id: string }) {
  const kind = part.mark ?? 'doc'
  if (!part.source) return <mark className={cx(styles.mark, styles[kind])}>{part.text}</mark>
  return (
    <span className={styles.markWrap}>
      <mark className={cx(styles.mark, styles[kind], styles.markTip)} tabIndex={0} aria-describedby={id}>
        {part.text}
      </mark>
      <span id={id} role="tooltip" className={cx(styles.tip, styles[`tip_${kind}`])}>
        <span className={styles.tipLabel}>
          {SOURCE_ICON[kind]}
          {part.source.label}
        </span>
        <span className={styles.tipQuote}>“{part.source.quote}”</span>
      </span>
    </span>
  )
}
