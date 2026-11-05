import { useId } from 'react'
import { Card, CardTitle, Field } from '../../components/ui'
import { cx } from '../../lib/cx'
import type { ReevaluationScope } from './types'
import styles from './improvement.module.css'

type ScopeOption = {
  value: ReevaluationScope
  label: string
  count: number
}

type ReevaluationScopeCardProps = {
  scope: ReevaluationScope
  onScopeChange: (scope: ReevaluationScope) => void
  allCount: number
  failedCount: number
  fromVersion: string
  memo: string
  onMemoChange: (memo: string) => void
}

/** 재평가 범위(전체 / 실패 문항) 선택 + 버전 메모 입력 */
export function ReevaluationScopeCard({
  scope,
  onScopeChange,
  allCount,
  failedCount,
  fromVersion,
  memo,
  onMemoChange,
}: ReevaluationScopeCardProps) {
  const memoId = useId()
  const options: ScopeOption[] = [
    { value: 'all', label: '전체 질문 세트', count: allCount },
    { value: 'failed', label: `${fromVersion} 실패 문항만`, count: failedCount },
  ]

  return (
    <Card className={styles.card}>
      <div className={styles.cardHeader}>
        <CardTitle>재평가 범위</CardTitle>
      </div>
      <div className={styles.scopeOptions} role="radiogroup" aria-label="재평가 범위">
        {options.map((option) => {
          const checked = scope === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              className={cx(styles.radio, checked && styles.radioChecked)}
              onClick={() => onScopeChange(option.value)}
            >
              <span className={styles.radioMark} aria-hidden />
              <span className={styles.radioLabel}>{option.label}</span>
              <span className={styles.radioCount}>{option.count}문항</span>
            </button>
          )
        })}
      </div>
      <Field label="버전 메모" htmlFor={memoId}>
        <input
          id={memoId}
          className={styles.memoInput}
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="이 버전에서 무엇을 바꿨는지 메모하세요"
        />
      </Field>
    </Card>
  )
}
