import { cx } from '../../../lib/cx'
import styles from './Divider.module.css'

/** strong: 사이드바 구분선(흰색 85%), subtle: 카드 내부 구분선 */
export function Divider({ tone = 'subtle' }: { tone?: 'strong' | 'subtle' }) {
  return <hr className={cx(styles.divider, tone === 'strong' && styles.strong)} />
}
