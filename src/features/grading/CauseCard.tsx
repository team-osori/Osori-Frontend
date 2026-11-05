import { Button, DiffView, Icon } from '../../components/ui'
import type { IconName } from '../../assets/icons'
import { cx } from '../../lib/cx'
import { CAUSE_INFO } from './causes'
import type { DiagnosisCause, FailureCause } from './types'
import styles from './diagnosis.module.css'

/** 원인 배지(검정 글씨) 안의 아이콘 */
const BADGE_ICON: Record<FailureCause, IconName> = {
  retrieval: 'databaseDark',
  prompt: 'messageDark',
  model: 'cpuDark',
}

/** 카드 맨 아래 안내(검색 · 모델 원인) 앞의 경고 아이콘 */
const NOTE_ICON: Partial<Record<FailureCause, IconName>> = {
  retrieval: 'alertTriangleAccent',
  model: 'alertTriangleAmber',
}

type CauseCardProps = {
  item: DiagnosisCause
  /** 프롬프트 수정 제안을 골랐는지 (프롬프트 원인만 해당) */
  selected: boolean
  onToggle: (id: string) => void
  onIgnore: (id: string) => void
}

/** 실패 원인 하나에 대한 진단 카드 */
export function CauseCard({ item, selected, onToggle, onIgnore }: CauseCardProps) {
  const info = CAUSE_INFO[item.cause]
  const noteIcon = NOTE_ICON[item.cause]

  return (
    <article className={cx(styles.card, selected && styles.cardSelected)} aria-label={`${item.question} 진단`}>
      <header className={styles.cardHead}>
        <span className={styles.badge} style={{ background: info.color }}>
          <Icon name={BADGE_ICON[item.cause]} />
          {item.label}
        </span>
        <span className={styles.meta}>{item.meta}</span>
      </header>

      <h3 className={styles.question}>{item.question}</h3>

      <p className={styles.answer}>
        답변: {item.answerBefore}
        <mark className={styles.flag}>{item.answerFlag}</mark>
        {item.answerAfter}
      </p>

      {item.chunk && (
        <div className={styles.chunk}>
          <strong>{item.chunk.title}</strong>
          <span>{item.chunk.text}</span>
        </div>
      )}

      {item.diff && <DiffView compact lines={item.diff} ariaLabel="프롬프트 수정 제안" />}

      {item.note && noteIcon && (
        <p className={cx(styles.note, item.cause === 'retrieval' ? styles.noteAccent : styles.noteAmber)}>
          <Icon name={noteIcon} />
          {item.note}
        </p>
      )}

      {item.diff && (
        <div className={styles.actions}>
          <Button variant="tonal" size="xs" className={styles.actionButton} onClick={() => onIgnore(item.id)}>
            무시
          </Button>
          <Button
            size="xs"
            className={cx(styles.actionButton, styles.actionStrong)}
            variant={selected ? 'primary' : 'tonal'}
            icon={selected ? 'checkDark' : undefined}
            aria-pressed={selected}
            onClick={() => onToggle(item.id)}
          >
            {selected ? '제안 선택됨' : '제안 선택'}
          </Button>
        </div>
      )}
    </article>
  )
}
