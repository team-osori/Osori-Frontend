import { Avatar, Icon } from '../../ui'
import styles from './UserProfile.module.css'

type UserProfileProps = { name: string; role: string; onClick?: () => void }

/** onClick이 없으면 버튼이 아닌 일반 정보로 표시 */
export function UserProfile({ name, role, onClick }: UserProfileProps) {
  const content = (
    <>
      <Avatar name={name} />
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        <span className={styles.role}>{role}</span>
      </span>
    </>
  )

  if (!onClick) return <div className={styles.profile}>{content}</div>

  return (
    <button type="button" className={styles.profile} onClick={onClick} aria-label={`${name} 계정 메뉴`}>
      {content}
      <Icon name="chevronRight" />
    </button>
  )
}
