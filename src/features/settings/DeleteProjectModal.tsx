import { useEffect, useState } from 'react'
import { Button, Modal, ModalText, TextField } from '../../components/ui'

type DeleteProjectModalProps = {
  open: boolean
  onClose: () => void
  projectName: string
  promptVersionCount: number
  questionSetCount: number
  onConfirm: () => void
}

/** 프로젝트 이름을 똑같이 입력해야 삭제할 수 있는 확인 창 */
export function DeleteProjectModal({
  open,
  onClose,
  projectName,
  promptVersionCount,
  questionSetCount,
  onConfirm,
}: DeleteProjectModalProps) {
  const [typed, setTyped] = useState('')
  const matches = typed.trim() === projectName

  // 다시 열 때마다 입력 초기화
  useEffect(() => {
    if (open) setTyped('')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="프로젝트를 삭제할까요?"
      actions={
        <>
          <Button variant="tonal" onClick={onClose}>
            취소
          </Button>
          <Button variant="dangerFill" disabled={!matches} onClick={onConfirm}>
            삭제
          </Button>
        </>
      }
    >
      <ModalText>
        ‘{projectName}’의 프롬프트 버전 {promptVersionCount}개, 질문 세트 {questionSetCount}개, 평가 기록이 휴지통으로
        이동합니다. 30일 안에는 복원할 수 있습니다.
      </ModalText>
      <TextField
        label="확인을 위해 프로젝트 이름을 입력하세요"
        danger
        placeholder={projectName}
        value={typed}
        autoComplete="off"
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches) onConfirm()
        }}
      />
    </Modal>
  )
}
