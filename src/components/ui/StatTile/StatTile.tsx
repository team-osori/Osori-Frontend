import { useId } from 'react'
import { Card } from '../Card/Card'
import styles from './StatTile.module.css'

type StatTileProps = {
  label: string
  value: number
  /** 주면 숫자를 직접 고칠 수 있음 (0 이상 정수) */
  onChange?: (value: number) => void
  max?: number
}

/** 라벨 + 숫자 칸 (유형별 질문 개수 등) */
export function StatTile({ label, value, onChange, max = 999 }: StatTileProps) {
  const id = useId()
  return (
    <div className={styles.tile}>
      <label className={styles.label} htmlFor={onChange ? id : undefined}>
        {label}
      </label>
      {onChange ? (
        <input
          id={id}
          className={styles.input}
          inputMode="numeric"
          value={String(value)}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, '') || 0)
            onChange(Math.min(max, n))
          }}
        />
      ) : (
        <span className={styles.value}>{value}</span>
      )}
    </div>
  )
}

/** 요약 정보 카드 (라벨 + 큰 값) */
export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className={styles.card}>
      <span className={styles.cardLabel}>{label}</span>
      <span className={styles.cardValue}>{value}</span>
    </Card>
  )
}
