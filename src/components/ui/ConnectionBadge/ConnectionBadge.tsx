import { Icon } from '../Icon/Icon'
import { StatusDot } from '../Badge/StatusBadge'
import styles from './ConnectionBadge.module.css'

type ConnectionBadgeProps = { label?: string; connected?: boolean }

export function ConnectionBadge({ label = '셀프 호스팅 인스턴스에 연결됨', connected = true }: ConnectionBadgeProps) {
  return (
    <div className={styles.badge} role="status">
      <Icon name="server" />
      <StatusDot tone={connected ? 'success' : 'neutral'} size={8} />
      {label}
    </div>
  )
}
