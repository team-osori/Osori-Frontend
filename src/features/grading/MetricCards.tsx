import { Card, ProgressBar } from '../../components/ui'
import { cx } from '../../lib/cx'
import type { MetricSummary } from './types'
import styles from './grading.module.css'

/** 버전을 오래된 순으로 놓았을 때 막대 색: 앞쪽은 회색, 가장 최근은 분홍 */
function toneFor(index: number, total: number) {
  if (index === total - 1) return 'primary' as const
  return index === 0 ? ('muted' as const) : ('mid' as const)
}

/** 마지막 두 버전의 점수 차이 (예: +2, ±0, -3) */
function deltaOf(scores: MetricSummary['scores']) {
  if (scores.length < 2) return null
  const diff = scores[scores.length - 1].score - scores[scores.length - 2].score
  return { diff, text: diff === 0 ? '±0' : diff > 0 ? `+${diff}` : `${diff}` }
}

/** 검색 · 근거 · 응답 · 정책 점수를 버전별로 비교하는 카드 */
export function MetricCard({ metric }: { metric: MetricSummary }) {
  const delta = deltaOf(metric.scores)
  const last = metric.scores[metric.scores.length - 1]
  const prev = metric.scores[metric.scores.length - 2]
  return (
    <Card as="article" className={styles.metricCard} aria-label={`${metric.label} 점수`}>
      <div className={styles.metricHead}>
        <h3 className={styles.metricTitle}>{metric.label}</h3>
        {delta && prev && (
          <span className={cx(styles.delta, delta.diff > 0 && styles.deltaUp)}>
            {prev.version}→{last.version} {delta.text}
          </span>
        )}
      </div>
      <ul className={styles.metricRows}>
        {metric.scores.map((item, index) => (
          <li key={item.version} className={styles.metricRow}>
            <span className={styles.metricVersion}>{item.version}</span>
            <ProgressBar
              size="md"
              value={item.score}
              tone={toneFor(index, metric.scores.length)}
              label={`${metric.label} ${item.version} 점수`}
            />
            <span className={styles.metricScore}>{item.score}%</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
