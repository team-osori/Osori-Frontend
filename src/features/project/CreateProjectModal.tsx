import { useState, type FormEvent } from 'react'
import { Button, Icon, Modal, ModalBody, ModalFooter, TextArea, TextField } from '../../components/ui'
import styles from './CreateProjectModal.module.css'

export type NewProject = { name: string; description: string }

type CreateProjectModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (project: NewProject) => void
}

/** 12 프로젝트 만들기 모달 */
export function CreateProjectModal({ open, onClose, onSubmit }: CreateProjectModalProps) {
  return (
    <Modal open={open} title="프로젝트 만들기" onClose={onClose}>
      {/* Modal이 닫히면 이 폼도 사라져서 다음에 열 때 입력값이 비어 있음 */}
      <CreateProjectForm onClose={onClose} onSubmit={onSubmit} />
    </Modal>
  )
}

function CreateProjectForm({ onClose, onSubmit }: Omit<CreateProjectModalProps, 'open'>) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const trimmedName = name.trim()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmedName) return
    onSubmit({ name: trimmedName, description: description.trim() })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ModalBody>
        <div className={styles.fields}>
          <TextField
            label="프로젝트 이름"
            name="name"
            autoComplete="off"
            placeholder="예: 모아몰 CS 챗봇"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextArea
            label="설명 (선택)"
            name="description"
            placeholder="어떤 서비스를 평가하는지 적어두세요"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <p className={styles.note}>
          <Icon name="server" />
          프로젝트 하나에 서비스 하나를 연결합니다. 만든 뒤 바로 연결 설정으로 이동합니다.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="tonal" className={styles.cancel} onClick={onClose}>
          취소
        </Button>
        <Button type="submit" iconEnd="arrowRight" disabled={!trimmedName}>
          만들고 연결 설정으로
        </Button>
      </ModalFooter>
    </form>
  )
}
