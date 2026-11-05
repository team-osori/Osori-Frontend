import { useEffect, useState } from 'react'
import { ProjectSidebar } from '../components/common'
import { cx } from '../lib/cx'
import { AppLayout } from '../layouts/AppLayout'
import { ROUTES } from '../routes'
import chevronIcon from '../assets/icons/stage/chevron-right-sm.svg'
import { MOCK_SCORE_ITEMS, type ScoreItem, type Verdict } from '../features/scoring/mock'
import { Kbd, PersonGlyph, Pill, SectionLabel, StageCard, StageHeader, Well } from '../features/stage/StageUI'
import styles from './ScoringPage.module.css'

const COLOR: Record<Verdict | 'none' | 'current', string> = {
  correct: 'var(--color-correct)',
  wrong: 'var(--color-wrong)',
  none: 'var(--color-pending)',
  current: '#fff',
}

type ScoringPageProps = {
  projectName?: string
  initialItems?: ScoreItem[]
  /** 다 채점하고 오답 노트로 */
  onFinish?: (items: ScoreItem[]) => void
}

/** 07 2단계 · 채점: 챗봇 답을 채점 기준과 비교해 맞음 / 틀림 */
export default function ScoringPage({ projectName = '모아몰 CS 챗봇', initialItems = MOCK_SCORE_ITEMS, onFinish }: ScoringPageProps) {
  const [items, setItems] = useState(initialItems)
  const [index, setIndex] = useState(() => Math.max(0, initialItems.findIndex((i) => i.verdict === null)))
  const [expanded, setExpanded] = useState(false)
  const item = items[index]

  const correct = items.filter((i) => i.verdict === 'correct').length
  const wrong = items.filter((i) => i.verdict === 'wrong').length
  const left = items.length - correct - wrong

  const go = (next: number) => {
    setIndex(Math.min(items.length - 1, Math.max(0, next)))
    setExpanded(false)
  }

  /** 판정 후 다음 안 한 문항으로 */
  const judge = (verdict: Verdict) => {
    const updated = items.map((it, i) => (i === index ? { ...it, verdict } : it))
    setItems(updated)
    const next = updated.findIndex((it, i) => i > index && it.verdict === null)
    const any = updated.findIndex((it) => it.verdict === null)
    go(next !== -1 ? next : any !== -1 ? any : index)
  }

  // J · K 이전 · 다음, O 맞음, X 틀림
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, [role="dialog"]')) return
      const k = e.key.toLowerCase()
      if (k === 'j') go(index - 1)
      else if (k === 'k') go(index + 1)
      else if (k === 'o') judge('correct')
      else if (k === 'x') judge('wrong')
      else return
      e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          projectName={projectName}
          promptOptions={[{ value: 'v3', label: 'v3 (최신)' }]}
          promptValue="v3"
          onPromptChange={() => {}}
          questionSet="v1 · 67문항"
          current={ROUTES.scoring}
          stageNotes={{ 1: 'v1 · 67문항 확정', 2: `${items.length - left} / ${items.length} 채점` }}
          unlockedUntil={2}
        />
      }
    >
      <div className={styles.page}>
        <StageHeader
          title="채점"
          aside={
            <div className={styles.score} aria-label={`정답 ${correct}, 오답 ${wrong}, ${index + 1}번째 / ${items.length}문항`}>
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
                <b>{index + 1}</b> / {items.length}
              </span>
            </div>
          }
        />

        <div className={styles.layout}>
          <StageCard className={styles.sheet}>
            <div className={styles.sheetHead}>
              <h2>응시 문항</h2>
              <span>
                {index + 1} / {items.length}
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
            </ul>
            <ol className={styles.grid}>
              {items.map((it, i) => {
                const active = i === index
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      className={cx(styles.seat, active && styles.seatActive)}
                      onClick={() => go(i)}
                      aria-current={active ? 'true' : undefined}
                      aria-label={`${i + 1}번 ${it.verdict === 'correct' ? '정답' : it.verdict === 'wrong' ? '오답' : '채점 전'}`}
                    >
                      <PersonGlyph color={active ? COLOR.current : COLOR[it.verdict ?? 'none']} />
                      <span>{i + 1}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <button type="button" className={styles.toNotes} disabled={left > 0} onClick={() => onFinish?.(items)}>
              {left > 0 ? `${left}문항 남음` : '오답 노트로'}
            </button>
          </StageCard>

          <StageCard className={styles.detail}>
            <div key={item.id} className={styles.detailBody} data-motion="rise">
              <div className={styles.meta}>
                <span className={styles.no}>{index + 1}</span>
                <Pill>{item.type}</Pill>
                <Pill className={styles.version}>프롬프트 {item.promptVersion}</Pill>
              </div>
              <h2 className={styles.question}>{item.question}</h2>

              <Well
                label="챗봇 답변"
                className={styles.answer}
                aside={
                  <button type="button" className={styles.more} onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
                    {expanded ? '접기' : '전체 보기'}
                    <img src={chevronIcon} alt="" width={14} height={14} className={cx(expanded && styles.up)} />
                  </button>
                }
              >
                <p className={cx(styles.answerText, expanded && styles.expanded)}>{item.answer}</p>
              </Well>

              <section className={styles.block}>
                <SectionLabel>채점 기준</SectionLabel>
                <ul className={styles.criteria}>
                  {item.criteria.map((c) => (
                    <li key={c.text} className={styles.criterion}>
                      {c.met ? <span className={styles.ring} aria-hidden /> : <span className={styles.cross} aria-hidden>✕</span>}
                      <span className={styles.criterionText}>{c.text}</span>
                      <b className={c.met ? styles.met : styles.missed}>{c.met ? '충족' : '빠짐'}</b>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.block}>
                <SectionLabel>해설</SectionLabel>
                <p className={styles.explain}>
                  {item.explanation.ref && <span className={styles.ref}>{item.explanation.ref}</span>}
                  {item.explanation.text}
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
                  className={cx(styles.verdict, styles.correct, item.verdict === 'correct' && styles.chosen)}
                  onClick={() => judge('correct')}
                  aria-pressed={item.verdict === 'correct'}
                >
                  <span className={styles.bigRing} aria-hidden />
                  맞음
                  <Kbd>O</Kbd>
                </button>
                <button
                  type="button"
                  className={cx(styles.verdict, styles.wrong, item.verdict === 'wrong' && styles.chosen)}
                  onClick={() => judge('wrong')}
                  aria-pressed={item.verdict === 'wrong'}
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
    </AppLayout>
  )
}
