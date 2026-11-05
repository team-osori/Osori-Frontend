import { cx } from '../../../lib/cx'
import styles from './Avatar.module.css'

type AvatarProps = {
  name: string
  /** md: 프로필(40px, 분홍 테두리) / sm: 표 안 멤버(36px, 테두리 없음) */
  size?: 'md' | 'sm'
  /** 배경이 surface인 곳(팝오버 등)에서 한 단계 밝은 배경 사용 */
  raised?: boolean
}

export function Avatar({ name, size = 'md', raised }: AvatarProps) {
  return (
    <span className={cx(styles.avatar, styles[size], raised && styles.raised)} aria-hidden>
      {name.slice(0, 1)}
    </span>
  )
}
