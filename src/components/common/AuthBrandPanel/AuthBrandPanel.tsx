import type { CSSProperties } from 'react'
import { Sticker } from '../../ui'
import { BrandMark } from '../BrandMark/BrandMark'
import styles from './AuthBrandPanel.module.css'

/** 로그인·회원가입 화면 왼쪽 브랜드 영역 */
export function AuthBrandPanel() {
  return (
    <section className={styles.panel}>
      <span data-motion="fade">
        <BrandMark />
      </span>

      <div className={styles.content}>
        <h1 className={styles.headline}>
          <span className={styles.line} data-motion="rise" style={{ '--delay': '120ms' } as CSSProperties}>
            프롬프트를 바꾸기 전에,
          </span>
          <span className={styles.line} data-motion="rise" style={{ '--delay': '240ms' } as CSSProperties}>
            같은 질문으로 <span className={styles.mark}>비교하세요.</span>
          </span>
        </h1>
        <p className={styles.lead} data-motion="rise" style={{ '--delay': '380ms' } as CSSProperties}>점수가 왜 낮은지, 검색·프롬프트·모델 중 어디를 고쳐야 하는지 알려드립니다.</p>
      </div>

      {/* 왼쪽 아래 형광펜과 그어 놓은 선 */}
      <span className={styles.highlighterWrap} data-motion="pop" style={{ '--delay': '450ms' } as CSSProperties}>
        <Sticker name="highlighter" width={260} motion="float" rot={-8} delay={1200} className={styles.highlighter} />
      </span>
      <span className={styles.squiggleWrap} data-motion="draw" style={{ '--delay': '800ms' } as CSSProperties}>
        <Sticker name="squiggle" width={240} className={styles.squiggle} />
      </span>
    </section>
  )
}
