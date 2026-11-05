import type { Ref } from 'react'
import { Avatar, Icon } from '../../ui'
import styles from './UserProfile.module.css'

type UserProfileProps = {
  name: string
  role: string
  onClick?: () => void
  /** 누르면 메뉴가 열리는 경우 트리거 버튼에 붙는 접근성 속성 */
  buttonRef?: Ref<HTMLButtonElement>
  'aria-haspopup'?: 'dialog' | 'menu'
  'aria-expanded'?: boolean
  'aria-controls'?: string
}

/** onClick이 없으면 버튼이 아닌 일반 정보로 표시 */
export function UserProfile({ name, role, onClick, buttonRef, ...aria }: UserProfileProps) {
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
    <button
      ref={buttonRef}
      type="button"
      className={styles.profile}
      onClick={onClick}
      aria-label={`${name} 계정 메뉴`}
      {...aria}
    >
      {content}
      <Icon name="chevronRight" />
    </button>
  )
}
