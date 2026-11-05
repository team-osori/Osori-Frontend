import { cx } from '../../lib/cx'
import { Icon } from '../../components/ui'
import styles from './grading.module.css'

/** 반복 실행별 판정 (✓ 통과 · ✕ 실패) */
export function VerdictMarks({ verdicts }: { verdicts: boolean[] }) {
  const passed = verdicts.filter(Boolean).length
  return (
    <ul className={styles.verdicts} aria-label={`${verdicts.length}회 중 ${passed}회 통과`}>
      {verdicts.map((pass, i) => (
        <li key={i} className={cx(styles.verdict, pass ? styles.pass : styles.fail)}>
          <Icon name={pass ? 'verdictPass' : 'verdictFail'} />
          <span className="sr-only">{`${i + 1}회차 ${pass ? '통과' : '실패'}`}</span>
        </li>
      ))}
    </ul>
  )
}
