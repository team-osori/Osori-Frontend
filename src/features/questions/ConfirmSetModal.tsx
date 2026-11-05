import { Button, Modal, ModalText, StatusDot, type StatusTone } from '../../components/ui'
import styles from './questions.module.css'

type ConfirmSetModalProps = {
  open: boolean
  onClose: () => void
  version: string
  approved: number
  deleted: number
  /** 승인했지만 근거 청크가 없는 질문 */
  unlabeled: number
  onConfirm: () => void
}

/** 질문 세트 확정 전 요약과 주의 안내 */
export function ConfirmSetModal({ open, onClose, version, approved, deleted, unlabeled, onConfirm }: ConfirmSetModalProps) {
  const next = `v${Number(version.replace(/\D/g, '') || 1) + 1}`
  const stats: Array<{ tone: StatusTone | 'caution'; label: string; value: number }> = [
    { tone: 'success', label: '승인', value: approved },
    { tone: 'danger', label: '삭제', value: deleted },
    { tone: 'caution', label: '라벨 없음', value: unlabeled },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`질문 세트 ${version}로 확정할까요?`}
      actions={
        <>
          <Button variant="tonal" onClick={onClose}>
            취소
          </Button>
          <Button iconEnd="arrowRight" onClick={onConfirm}>
            확정하고 실행으로
          </Button>
        </>
      }
    >
      <dl className={styles.summary}>
        {stats.map((s) => (
          <div key={s.label} className={styles.summaryItem}>
            <dt>
              {s.tone === 'caution' ? <span className={styles.cautionDot} /> : <StatusDot tone={s.tone} size={8} />}
              {s.label}
            </dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
      <ModalText>
        확정하면 질문을 더 고칠 수 없습니다. 고치려면 질문 세트 {next}를 새로 만들어야 하고, 이전 평가와는 직접 비교되지
        않습니다.
      </ModalText>
    </Modal>
  )
}
