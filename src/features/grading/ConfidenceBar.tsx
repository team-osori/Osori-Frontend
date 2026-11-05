import type { CSSProperties } from 'react'
import { Card, CountUp, Icon } from '../../components/ui'
import styles from './grading.module.css'

type ConfidenceBarProps = {
  agreement: number
  unstableCount: number
  labeledCount: number
  totalCount: number
  onShowUnstable?: () => void
}

/** 채점 신뢰도 요약: 채점자 일치도 · 불안정 문항 · 라벨 있는 질문 */
export function ConfidenceBar({ agreement, unstableCount, labeledCount, totalCount, onShowUnstable }: ConfidenceBarProps) {
  return (
    <Card as="section" className={styles.confidence} aria-label="채점 신뢰도" style={{ '--i': 1 } as CSSProperties}>
      <h2 className={styles.confidenceTitle}>신뢰도</h2>
      <dl className={styles.confidenceStats}>
        <div className={styles.stat}>
          <dt>채점자 일치도</dt>
          <dd>
            <CountUp value={agreement} delay={300} />%
          </dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statWarn}>
            <Icon name="warningAmber" />
            불안정 문항
          </dt>
          <dd>
            <CountUp value={unstableCount} delay={350} duration={600} />개
          </dd>
        </div>
        <div className={styles.stat}>
          <dt>라벨 있는 질문</dt>
          <dd>
            {labeledCount} / {totalCount}
          </dd>
        </div>
      </dl>
      {onShowUnstable && (
        <button type="button" className={styles.confidenceLink} onClick={onShowUnstable}>
          불안정 문항 보기
          <Icon name="chevronRightAccent" />
        </button>
      )}
    </Card>
  )
}
