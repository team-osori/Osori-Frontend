import { Drawer, Icon, Tag } from '../../components/ui'
import type { UnstableItem } from './types'
import { VerdictMarks } from './VerdictMarks'
import styles from './grading.module.css'

type UnstableDrawerProps = {
  open: boolean
  onClose: () => void
  items: UnstableItem[]
  /** 사람 판정 화면으로 이동 */
  onJudge: (item: UnstableItem) => void
}

/** 반복했을 때 판정이 달라진 문항 목록 */
export function UnstableDrawer({ open, onClose, items, onJudge }: UnstableDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon="warningLg"
      title={`불안정 문항 ${items.length}`}
      description="같은 질문을 반복했을 때 판정이 달라진 문항입니다. 모두 사람 판정 대기열에 들어가 있습니다."
    >
      {items.map((item) => (
        <article key={item.id} className={styles.item}>
          <div className={styles.itemHead}>
            <h3 className={styles.question}>{item.question}</h3>
            <Tag strong={false}>{item.criterion}</Tag>
          </div>
          <div className={styles.itemFoot}>
            <span className={styles.runs}>
              {item.version} 반복 {item.verdicts.length}회
            </span>
            <VerdictMarks verdicts={item.verdicts} />
            <button type="button" className={styles.judge} onClick={() => onJudge(item)}>
              판정하기
              <Icon name="chevronRightAccent" />
              <span className="sr-only">: {item.question}</span>
            </button>
          </div>
        </article>
      ))}
    </Drawer>
  )
}
