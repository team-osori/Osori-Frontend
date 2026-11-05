import { Icon } from '../Icon/Icon'
import { StatusDot } from '../Badge/StatusBadge'
import styles from './ConnectionBadge.module.css'

type ConnectionBadgeProps = { label?: string; connected?: boolean }

/** label을 주지 않으면 연결 상태에 맞는 기본 문구 사용 */
export function ConnectionBadge({ label, connected = true }: ConnectionBadgeProps) {
  const text = label ?? (connected ? '셀프 호스팅 인스턴스에 연결됨' : '셀프 호스팅 인스턴스에 연결되지 않음')
  return (
    <div className={styles.badge} role="status">
      <Icon name="server" />
      <StatusDot tone={connected ? 'success' : 'neutral'} size={8} />
      {text}
    </div>
  )
}
