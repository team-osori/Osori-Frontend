import { Card, CardTitle, Checkbox, Icon } from '../../components/ui'
import type { Suggestion } from './types'
import styles from './improvement.module.css'

type SuggestionsCardProps = {
  suggestions: Suggestion[]
  /** 체크된 제안 id 집합 */
  selected: Set<string>
  onToggle: (id: string, checked: boolean) => void
  /** 프롬프트로 해결되지 않는 원인 안내 문구 */
  unresolvedNote: string
  onConfirmSettings?: () => void
}

/** 자동 진단이 제안한 프롬프트 개선안 목록 */
export function SuggestionsCard({
  suggestions,
  selected,
  onToggle,
  unresolvedNote,
  onConfirmSettings,
}: SuggestionsCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.cardHeader}>
        <CardTitle>적용할 제안</CardTitle>
      </div>
      <div className={styles.suggestions}>
        {suggestions.map((s) => (
          <div key={s.id} className={styles.suggestion}>
            <Checkbox
              checked={selected.has(s.id)}
              onChange={(checked) => onToggle(s.id, checked)}
              label={s.title}
            />
            <p className={styles.suggestionRationale}>{s.rationale}</p>
          </div>
        ))}
      </div>
      <p className={styles.unresolved}>
        <Icon name="warning" />
        <span>
          {unresolvedNote}
          {onConfirmSettings && (
            <>
              {' '}
              <button type="button" onClick={onConfirmSettings}>
                검색 설정 확인
              </button>
            </>
          )}
        </span>
      </p>
    </Card>
  )
}
