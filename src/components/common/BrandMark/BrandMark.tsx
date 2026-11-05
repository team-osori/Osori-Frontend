import { cx } from '../../../lib/cx'
import styles from './BrandMark.module.css'

type BrandMarkProps = {
  tone?: 'sidebar' | 'panel'
  title?: string
  subtitle?: string
}

export function BrandMark({ tone = 'sidebar', title = '프롬프트 평가', subtitle = '셀프 호스팅' }: BrandMarkProps) {
  return (
    <div className={cx(styles.brand, styles[tone])}>
      <span className={styles.logo} aria-hidden>
        평가
      </span>
      <div className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </div>
    </div>
  )
}
