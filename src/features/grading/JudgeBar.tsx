import { Icon, ProgressBar } from '../../components/ui'
import styles from './judge.module.css'

type JudgeBarProps = {
  done: number
  total: number
  onFail: () => void
  onPass: () => void
}

/** 하단 판정 바: 진행률 · 이전/다음 단축키 안내 · 실패/통과 버튼 */
export function JudgeBar({ done, total, onFail, onPass }: JudgeBarProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className={styles.bar}>
      <div className={styles.progress}>
        <span role="status">
          {done} / {total} 판정 완료
        </span>
        <ProgressBar size="sm" value={percent} label={`판정 진행률 ${percent}%`} />
      </div>

      <div className={styles.barActions}>
        <span className={styles.keyHint}>
          <kbd className={styles.key}>J</kbd>
          <kbd className={styles.key}>K</kbd>
          이전 · 다음
        </span>
        <button type="button" className={styles.failButton} onClick={onFail} aria-keyshortcuts="F">
          <Icon name="circleXDanger" />
          실패
          <kbd className={styles.key}>F</kbd>
        </button>
        <button type="button" className={styles.passButton} onClick={onPass} aria-keyshortcuts="P">
          <Icon name="circleCheckDark" />
          통과
          <kbd className={styles.keyDark}>P</kbd>
        </button>
      </div>
    </div>
  )
}
