import { Card, CardTitle, Icon } from '../../components/ui'
import { cx } from '../../lib/cx'
import type { DiffLine } from './types'
import styles from './improvement.module.css'

type PromptDiffCardProps = {
  fromVersion: string
  toVersion: string
  changedLines: number
  diff: DiffLine[]
}

/** v3 → v4 프롬프트 변경을 diff 형태로 보여주는 패널 */
export function PromptDiffCard({ fromVersion, toVersion, changedLines, diff }: PromptDiffCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.cardHeader}>
        <CardTitle>프롬프트 변경</CardTitle>
        <span className={styles.versionFlow}>
          <span className={styles.versionFrom}>{fromVersion}</span>
          <span className={styles.versionArrow} aria-hidden>→</span>
          <span className={styles.versionTo}>{toVersion}</span>
          {changedLines}줄 수정
        </span>
      </div>

      <div className={styles.diff} role="group" aria-label={`${fromVersion}에서 ${toVersion}로의 프롬프트 변경`}>
        {diff.map((line, i) => (
          <div key={`${line.number}-${i}`} className={cx(styles.line, styles[line.kind])}>
            <span className={styles.lineNo}>{line.number}</span>
            <span className={styles.lineText}>{line.text}</span>
          </div>
        ))}
      </div>

      <p className={styles.editHint}>
        <Icon name="pencil" />
        직접 수정하려면 줄을 클릭하세요
      </p>
    </Card>
  )
}
