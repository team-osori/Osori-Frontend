import type { CSSProperties } from 'react'
import { Card, CardHeader } from '../../components/ui'
import { CAUSE_INFO, CAUSE_ORDER } from './causes'
import type { FailureBreakdown } from './types'
import styles from './grading.module.css'

function total(row: FailureBreakdown) {
  return CAUSE_ORDER.reduce((sum, cause) => sum + row.counts[cause], 0)
}

type FailureChartProps = {
  rows: FailureBreakdown[]
  /** 막대 아래에 보여줄 해설 문장 */
  note?: string
}

/** 실패 원인 분포 막대: 버전마다 한 줄, 길이는 건수에 비례 */
export function FailureChart({ rows, note }: FailureChartProps) {
  // 가장 긴 줄을 100%로 두고 나머지를 비례해서 그림
  const max = Math.max(...rows.map(total), 1)

  return (
    <Card as="section" className={styles.chartCard} aria-label="실패 원인 분포">
      <CardHeader title="실패 원인 분포 · v2 vs v3">
        <ul className={styles.legend}>
          {CAUSE_ORDER.map((cause) => (
            <li key={cause} className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: CAUSE_INFO[cause].color }} aria-hidden />
              {CAUSE_INFO[cause].label}
            </li>
          ))}
        </ul>
      </CardHeader>

      <div className={styles.bars}>
        {rows.map((row, r) => (
          <div key={row.version} className={styles.barRow}>
            <span className={styles.barVersion}>{row.version}</span>
            <div
              className={styles.barTrack}
              data-motion="fill"
              style={{ '--delay': `${650 + r * 180}ms` } as CSSProperties}
              role="img"
              aria-label={`${row.version} 실패 ${total(row)}건: ${CAUSE_ORDER.map((c) => `${CAUSE_INFO[c].label} ${row.counts[c]}건`).join(', ')}`}
            >
              {CAUSE_ORDER.map((cause) =>
                row.counts[cause] > 0 ? (
                  <span
                    key={cause}
                    className={styles.barSegment}
                    style={{ flexGrow: row.counts[cause], background: CAUSE_INFO[cause].color }}
                  >
                    <span data-motion="pop" style={{ '--delay': `${1050 + r * 180}ms` } as CSSProperties}>
                      {row.counts[cause]}
                    </span>
                  </span>
                ) : null,
              )}
              {/* 줄 길이를 건수에 비례시키기 위한 빈 공간 */}
              <span style={{ flexGrow: max - total(row), flexBasis: 0 }} aria-hidden />
            </div>
            <span className={styles.barTotal}>실패 {total(row)}건</span>
          </div>
        ))}
      </div>

      {note && <p className={styles.chartNote}>{note}</p>}
    </Card>
  )
}
