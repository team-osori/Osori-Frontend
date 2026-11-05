import { cx } from '../../../lib/cx'
import styles from './DiffView.module.css'

export type DiffLine = {
  /** 새 버전 기준 줄 번호 */
  number: number
  text: string
  type: 'same' | 'added' | 'removed'
}

const PREFIX = { same: '', added: '+', removed: '-' } as const
const LABEL = { same: '', added: '추가됨: ', removed: '삭제됨: ' } as const

/** 프롬프트 버전 간 변경 내용. 추가는 초록, 삭제는 빨강 */
export function DiffView({ lines, ariaLabel }: { lines: DiffLine[]; ariaLabel?: string }) {
  return (
    <ol className={styles.view} aria-label={ariaLabel}>
      {lines.map((line) => (
        <li key={`${line.type}-${line.number}`} className={cx(styles.line, line.type !== 'same' && styles[line.type])}>
          <span className={styles.number} aria-hidden>
            {PREFIX[line.type]}
            {line.number}
          </span>
          <span>
            <span className="sr-only">{LABEL[line.type]}</span>
            {line.text}
          </span>
        </li>
      ))}
    </ol>
  )
}
