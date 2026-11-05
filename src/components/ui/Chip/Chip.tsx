import type { ReactNode } from 'react'
import type { IconName } from '../../../assets/icons'
import { Icon } from '../Icon/Icon'
import styles from './Chip.module.css'

type ChipProps = {
  label: string
  icon?: IconName
  /** 주면 오른쪽에 X 버튼 */
  onRemove?: () => void
}

/** 선택된 값을 보여주는 작은 칩 (근거 청크 등) */
export function Chip({ label, icon, onRemove }: ChipProps) {
  return (
    <span className={styles.chip}>
      {icon && <Icon name={icon} />}
      <span className={styles.label} title={label}>
        {label}
      </span>
      {onRemove && (
        <button type="button" className={styles.remove} onClick={onRemove} aria-label={`${label} 빼기`}>
          <Icon name="xSm" />
        </button>
      )}
    </span>
  )
}

/** 칩 여러 개 + 뒤에 추가 버튼 등을 나란히 */
export function ChipList({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className={styles.list} role="group" aria-label={label}>
      {children}
    </div>
  )
}
