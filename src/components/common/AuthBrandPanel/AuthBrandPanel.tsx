import { Sticker } from '../../ui'
import { BrandMark } from '../BrandMark/BrandMark'
import styles from './AuthBrandPanel.module.css'

/** 로그인·회원가입 화면 왼쪽 브랜드 영역 */
export function AuthBrandPanel() {
  return (
    <section className={styles.panel}>
      <BrandMark />

      <div className={styles.content}>
        <h1 className={styles.headline}>
          프롬프트를 바꾸기 전에,
          <br />
          같은 질문으로 비교하세요.
        </h1>
        <p className={styles.lead}>점수가 왜 낮은지, 검색·프롬프트·모델 중 어디를 고쳐야 하는지 알려드립니다.</p>
      </div>

      {/* 왼쪽 아래 형광펜과 그어 놓은 선 */}
      <Sticker name="highlighter" width={260} className={styles.highlighter} />
      <Sticker name="squiggle" width={240} className={styles.squiggle} />
    </section>
  )
}
