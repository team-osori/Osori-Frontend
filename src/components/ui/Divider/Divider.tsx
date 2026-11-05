type DividerProps = { tone?: 'strong' | 'subtle'; inset?: number }

/** strong: 사이드바 구분선(흰색 85%), subtle: 카드 내부 구분선 */
export function Divider({ tone = 'subtle', inset = 0 }: DividerProps) {
  return (
    <hr
      style={{
        flexShrink: 0,
        height: 1,
        margin: `0 ${inset}px`,
        border: 'none',
        background: tone === 'strong' ? 'var(--color-divider)' : 'var(--color-surface-strong)',
      }}
    />
  )
}
