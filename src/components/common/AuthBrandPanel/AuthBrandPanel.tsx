import { ConnectionBadge } from '../../ui'
import { BrandMark } from '../BrandMark/BrandMark'
import styles from './AuthBrandPanel.module.css'

/** 로그인·초기 설정 화면 좌측 브랜드 패널 */
export function AuthBrandPanel({ connected = true }: { connected?: boolean }) {
  return (
    <section className={styles.panel}>
      <BrandMark tone="panel" />
      <div className={styles.content}>
        <h1 className={styles.headline}>
          프롬프트를 바꾸기 전에,
          <br />
          <span className={styles.highlight}>같은 질문으로</span> 비교하세요.
        </h1>
        <p className={styles.lead}>점수가 왜 낮은지, 검색·프롬프트·모델 중 어디를 고쳐야 하는지 알려드립니다.</p>
      </div>
      <div className={styles.badge}>
        <ConnectionBadge connected={connected} />
      </div>
    </section>
  )
}
