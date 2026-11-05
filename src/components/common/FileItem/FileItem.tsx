import { Icon } from '../../ui'
import styles from './FileItem.module.css'

/** 문서 한 줄: 파일 아이콘 · 이름 · 오른쪽 부가 정보(청크 수 등) */
export function FileItem({ name, meta }: { name: string; meta?: string }) {
  return (
    <div className={styles.item}>
      <Icon name="file" />
      <span className={styles.name} title={name}>
        {name}
      </span>
      {meta && <span className={styles.meta}>{meta}</span>}
    </div>
  )
}

/** 작은 문서 참조 (예: 주문안내.pdf #3) */
export function FileRef({ label }: { label: string }) {
  return (
    <span className={styles.inline}>
      <Icon name="fileSm" />
      {label}
    </span>
  )
}
