import { StatusBadge } from '../../components/ui'
import { StatusDot } from '../../components/ui'
import { cx } from '../../lib/cx'
import { REASON_INFO, REASON_ORDER, STATUS_LABEL } from './judgeInfo'
import type { JudgeItem } from './types'
import styles from './judge.module.css'

type QueuePanelProps = {
  items: JudgeItem[]
  selectedId: string
  onSelect: (id: string) => void
}

/** 사람 판정 대기열: 위에 분류별 개수, 아래에 문항 목록 */
export function QueuePanel({ items, selectedId, onSelect }: QueuePanelProps) {
  return (
    <section className={styles.queue} aria-label="대기열">
      <header className={styles.queueHead}>
        <h2 className={styles.queueTitle}>
          대기열 <span className={styles.queueCount}>{items.length}건</span>
        </h2>
        <ul className={styles.reasonChips}>
          {REASON_ORDER.map((reason) => (
            <li key={reason}>
              <StatusBadge tone={REASON_INFO[reason].tone}>
                {REASON_INFO[reason].label} {items.filter((i) => i.reason === reason).length}
              </StatusBadge>
            </li>
          ))}
        </ul>
      </header>

      <ul className={styles.queueList}>
        {items.map((item) => {
          const selected = item.id === selectedId
          return (
            <li key={item.id}>
              <button
                type="button"
                className={cx(styles.queueItem, selected && styles.queueItemActive)}
                aria-current={selected ? 'true' : undefined}
                onClick={() => onSelect(item.id)}
              >
                <span className={styles.queueQuestion}>{item.question}</span>
                <span className={styles.queueMeta}>
                  <StatusDot tone={REASON_INFO[item.reason].tone} />
                  {REASON_INFO[item.reason].label}
                  <span className={styles.queueStatus}>{STATUS_LABEL[item.status]}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
