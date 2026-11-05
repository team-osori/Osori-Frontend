import { Button, Sticker, type StickerName } from '../../components/ui'
import { STAGES } from '../../routes'
import styles from './Onboarding.module.css'

const STAGE_ART: Array<{ sticker: StickerName; width: number }> = [
  { sticker: 'notepad', width: 78 },
  { sticker: 'checkCircle', width: 46 },
  { sticker: 'stickyNote', width: 70 },
]

const STAGE_DESC = [
  '정책 문서로 문제를 만들고 하나씩 검토합니다.',
  '챗봇의 답을 O / X로 채점하고 틀린 이유를 고릅니다.',
  '틀린 이유를 보고 프롬프트를 고쳐 다시 시험합니다.',
]

/** 02-1 프로젝트가 없을 때: 첫 프로젝트 안내 + 평가 3단계 소개 */
export function Onboarding({ onCreateProject }: { onCreateProject?: () => void }) {
  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <Sticker name="folder" width={60} className={styles.heroArt} />
        <div className={styles.heroText}>
          <h2 className={styles.heroTitle}>첫 프로젝트를 만들어 보세요</h2>
          <p className={styles.heroDesc}>프로젝트 하나에 챗봇 서비스 하나를 연결합니다.</p>
        </div>
        <Button size="xs" icon="plusSm" onClick={onCreateProject}>
          새 프로젝트 만들기
        </Button>
      </section>

      <ol className={styles.stages}>
        {STAGES.map((stage, i) => (
          <li key={stage.label} className={styles.stage}>
            <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>
            <Sticker name={STAGE_ART[i].sticker} width={STAGE_ART[i].width} className={styles.art} />
            <h3 className={styles.stageTitle}>{stage.label}</h3>
            <p className={styles.stageDesc}>{STAGE_DESC[i]}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
