import { Button, Modal } from '../../components/ui'
import styles from './improvement.module.css'

type ReevaluateModalProps = {
  open: boolean
  onClose: () => void
  fromVersion: string
  toVersion: string
  questionSet: string
  repeats: number
  graders: number
  /** 적용한 제안 제목들 */
  appliedTitles: string[]
  onConfirm: () => void
}

/** 재평가 실행 전 비교 조건 확인 */
export function ReevaluateModal({
  open,
  onClose,
  fromVersion,
  toVersion,
  questionSet,
  repeats,
  graders,
  appliedTitles,
  onConfirm,
}: ReevaluateModalProps) {
  const applied =
    appliedTitles.length === 0
      ? '없음'
      : appliedTitles.length === 1
        ? appliedTitles[0]
        : `${appliedTitles[0]} 외 ${appliedTitles.length - 1}개`

  const rows = [
    ['비교', `${fromVersion} vs ${toVersion}`],
    ['질문 세트', questionSet],
    ['반복 · 채점자', `문항당 ${repeats}회 · ${graders}명`],
    ['적용한 제안', applied],
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${toVersion}로 재평가를 실행할까요?`}
      actions={
        <>
          <Button variant="tonal" onClick={onClose}>
            취소
          </Button>
          <Button iconEnd="arrowRight" onClick={onConfirm}>
            재평가 실행
          </Button>
        </>
      }
    >
      <dl className={styles.confirmRows}>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.confirmRow}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.confirmNote}>
        실행이 끝나면 자동 채점 결과로 이동합니다. 실행 중에는 {toVersion}를 수정할 수 없습니다.
      </p>
    </Modal>
  )
}
