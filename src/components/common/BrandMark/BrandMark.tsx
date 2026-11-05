import { cx } from '../../../lib/cx'
import logo from '../../../assets/brand/pebble-logo.png'
import mark from '../../../assets/brand/pebble-mark.png'
import styles from './BrandMark.module.css'

type BrandMarkProps = {
  /** mark: 조약돌 마크만 (아이콘 레일) · full: 마크 + Pebble 글자 (로그인 · 상단 바) */
  variant?: 'mark' | 'full'
  className?: string
}

/** Pebble 로고. scripts/cut-logo.py로 만든 이미지 */
export function BrandMark({ variant = 'full', className }: BrandMarkProps) {
  return (
    <span className={cx(styles.brand, className)}>
      {variant === 'full' ? (
        <img className={styles.logo} src={logo} alt="Pebble" />
      ) : (
        <img className={styles.mark} src={mark} alt="Pebble" />
      )}
    </span>
  )
}
