import { Avatar, Icon } from '../../ui'
import styles from './UserProfile.module.css'

type UserProfileProps = { name: string; role: string; onClick?: () => void }

export function UserProfile({ name, role, onClick }: UserProfileProps) {
  return (
    <button type="button" className={styles.profile} onClick={onClick}>
      <Avatar name={name} />
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        <span className={styles.role}>{role}</span>
      </span>
      <Icon name="chevronRight" />
    </button>
  )
}
