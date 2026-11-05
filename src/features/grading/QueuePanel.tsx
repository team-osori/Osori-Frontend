import { useState } from 'react'
import { StatusBadge, StatusDot } from '../../components/ui'
import { cx } from '../../lib/cx'
import { REASON_INFO, REASON_ORDER, STATUS_LABEL } from './judgeInfo'
import type { JudgeItem } from './types'
import styles from './judge.module.css'

type Reason = JudgeItem['reason']

type QueuePanelProps = {
  items: JudgeItem[]
  selectedId: string
  onSelect: (id: string) => void
}

/** 사람 판정 대기열: 위에 분류별 개수(누르면 그 분류만 보기), 아래에 문항 목록 */
export function QueuePanel({ items, selectedId, onSelect }: QueuePanelProps) {
  const [filter, setFilter] = useState<Reason | null>(null)
  const visible = filter ? items.filter((i) => i.reason === filter) : items

  return (
    <section className={styles.queue} aria-label="대기열">
      <header className={styles.queueHead}>
        <h2 className={styles.queueTitle}>
          대기열{' '}
          <span className={styles.queueCount}>
            {filter ? `${visible.length} / ${items.length}건` : `${items.length}건`}
          </span>
        </h2>
        <ul className={styles.reasonChips} aria-label="분류로 걸러 보기">
          {REASON_ORDER.map((reason) => {
            const active = filter === reason
            return (
              <li key={reason}>
                <button
                  type="button"
                  className={cx(styles.reasonChip, active && styles.reasonChipActive, filter && !active && styles.reasonChipDim)}
                  aria-pressed={active}
                  onClick={() => setFilter(active ? null : reason)}
                  title={active ? '다시 누르면 전체 보기' : `${REASON_INFO[reason].label}만 보기`}
                >
                  <StatusBadge tone={REASON_INFO[reason].tone}>
                    {REASON_INFO[reason].label} {items.filter((i) => i.reason === reason).length}
                  </StatusBadge>
                </button>
              </li>
            )
          })}
        </ul>
      </header>

      <ul className={styles.queueList}>
        {visible.map((item) => {
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
      {visible.length === 0 && <p className={styles.queueEmpty}>이 분류의 문항이 없습니다.</p>}
    </section>
  )
}
