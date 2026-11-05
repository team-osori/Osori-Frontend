import { Card, CardHeader } from '../../components/ui'
import { cx } from '../../lib/cx'
import type { PromptVersion } from './types'
import styles from './grading.module.css'

/** 프롬프트 버전 목록. 목록의 첫 번째(가장 최근) 버전만 분홍으로 강조 */
export function VersionList({ versions }: { versions: PromptVersion[] }) {
  return (
    <Card as="section" className={styles.versionCard} aria-label="프롬프트 버전">
      <CardHeader title="프롬프트 버전" />
      <ol className={styles.versionList}>
        {versions.map((item, index) => (
          <li key={item.version} className={styles.versionItem}>
            <span className={cx(styles.versionTag, index === 0 && styles.versionTagLatest)}>{item.version}</span>
            <span className={styles.versionTitle}>{item.title}</span>
            <time className={styles.versionTime}>{item.createdAt}</time>
          </li>
        ))}
      </ol>
    </Card>
  )
}
