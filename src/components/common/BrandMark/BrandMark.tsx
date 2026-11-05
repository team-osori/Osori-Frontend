import { cx } from '../../../lib/cx'
import styles from './BrandMark.module.css'

type BrandMarkProps = {
  /** mark: 로고만 (아이콘 레일) · full: 로고 + 서비스 이름 (로그인) */
  variant?: 'mark' | 'full'
  className?: string
}

/** 라임색 "평" 로고. variant="full"이면 옆에 "프롬프트 평가"를 붙임 */
export function BrandMark({ variant = 'full', className }: BrandMarkProps) {
  return (
    <div className={cx(styles.brand, className)}>
      <span className={styles.logo} aria-hidden>
        평
      </span>
      {variant === 'full' ? <span className={styles.word}>프롬프트 평가</span> : <span className="sr-only">프롬프트 평가</span>}
    </div>
  )
}
