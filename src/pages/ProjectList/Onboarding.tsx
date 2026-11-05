import type { CSSProperties } from 'react'
import check from '../../assets/onboarding/check.png'
import folder from '../../assets/onboarding/folder.png'
import notepaper from '../../assets/onboarding/notepaper.png'
import sticky from '../../assets/onboarding/sticky.png'
import plusDark from '../../assets/icons/stage/plus-dark.svg'
import { STAGES } from '../../routes'
import styles from './Onboarding.module.css'

/** 시안 02-1 카드별 일러스트: 카드 오른쪽 밖으로 살짝 잘려 나감 */
const STAGE_ART = [
  { src: notepaper, width: 267, height: 255, top: 128, right: -43 },
  { src: check, width: 276, height: 240, top: 143, right: -80 },
  { src: sticky, width: 290, height: 250, top: 152, right: -86 },
]

const STAGE_DESC = [
  '정책 문서로 문제를 만들고 하나씩 검토합니다.',
  '챗봇의 답을 ○ / ✕로 채점하고 틀린 이유를 고릅니다.',
  '틀린 이유를 보고 프롬프트를 고쳐 다시 시험합니다.',
]

/** 02-1 프로젝트가 없을 때: 첫 프로젝트 안내 + 평가 3단계 소개 (Figma 330:3368) */
export function Onboarding({ onCreateProject }: { onCreateProject?: () => void }) {
  return (
    <div className={styles.root} data-motion="stagger">
      <section className={styles.hero}>
        <img src={folder} alt="" width={107} height={104} className={styles.heroArt} />
        <div className={styles.heroText}>
          <h2 className={styles.heroTitle}>첫 프로젝트를 만들어 보세요</h2>
          <p className={styles.heroDesc}>프로젝트 하나에 챗봇 서비스 하나를 연결합니다.</p>
        </div>
        <button type="button" className={styles.create} onClick={onCreateProject}>
          <img src={plusDark} alt="" width={18} height={18} />새 프로젝트 만들기
        </button>
      </section>

      <ol className={styles.stages} style={{ '--i': 1 } as CSSProperties}>
        {STAGES.map((stage, i) => {
          const art = STAGE_ART[i]
          return (
            <li key={stage.label} className={styles.stage}>
              <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>
              <img
                src={art.src}
                alt=""
                width={art.width}
                height={art.height}
                className={styles.art}
                style={{ top: art.top, right: art.right }}
              />
              <div className={styles.stageText}>
                <h3 className={styles.stageTitle}>{stage.label}</h3>
                <p className={styles.stageDesc}>{STAGE_DESC[i]}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
