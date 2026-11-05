import { useId } from 'react'
import { Card, CardHeader, Field, Select, type SelectOption } from '../../components/ui'
import styles from './connection.module.css'

type GradersCardProps = {
  options: SelectOption[]
  graderA: string
  graderB: string
  onChange: (patch: { graderA?: string; graderB?: string }) => void
}

/** 자동 채점에 쓸 두 채점 모델 */
export function GradersCard({ options, graderA, graderB, onChange }: GradersCardProps) {
  const idA = useId()
  const idB = useId()
  return (
    <Card className={styles.card}>
      <CardHeader title="채점자" />
      <Field label="채점 모델 A" htmlFor={idA}>
        <Select id={idA} size="field" options={options} value={graderA} onChange={(v) => onChange({ graderA: v })} />
      </Field>
      <Field label="채점 모델 B" htmlFor={idB}>
        <Select id={idB} size="field" options={options} value={graderB} onChange={(v) => onChange({ graderB: v })} />
      </Field>
      <p className={styles.note}>두 채점자의 판정이 갈린 문항은 사람 판정 대기열로 보냅니다.</p>
    </Card>
  )
}
