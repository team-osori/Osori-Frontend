import { Button, Modal, ModalText, ProgressBar } from '../../components/ui'
import styles from './abRun.module.css'

type StopRunModalProps = {
  open: boolean
  /** 계속 실행 (모달만 닫음) */
  onClose: () => void
  version: string
  done: number
  total: number
  onStop: () => void
}

/** 실행 중단 전 진행 상황과 이어서 실행 가능 안내 */
export function StopRunModal({ open, onClose, version, done, total, onStop }: StopRunModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="실행을 중단할까요?"
      size="sm"
      actions={
        <>
          <Button variant="tonal" onClick={onClose}>
            계속 실행
          </Button>
          <Button variant="dangerFill" onClick={onStop}>
            중단
          </Button>
        </>
      }
    >
      <div className={styles.stopProgress}>
        <div className={styles.progressHead}>
          {version} 답변 수집
          <span className={styles.progressCount}>
            {done} / {total}
          </span>
        </div>
        <ProgressBar value={(done / total) * 100} label={`${version} 답변 수집 진행률`} />
      </div>
      <ModalText>
        이미 수집한 답변 {done}개는 저장됩니다. 나중에 남은 {total - done}문항부터 이어서 실행할 수 있습니다.
      </ModalText>
    </Modal>
  )
}
