import { useState, type FormEvent } from 'react'
import { Button, Icon, Modal, TextArea, TextField } from '../../components/ui'
import styles from './CreateProjectModal.module.css'

export type NewProject = { name: string; description: string }

type CreateProjectModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (project: NewProject) => void
}

/** 12 프로젝트 만들기 모달 */
export function CreateProjectModal({ open, onClose, onSubmit }: CreateProjectModalProps) {
  // 열릴 때마다 새 폼이 만들어지도록 open일 때만 렌더링해서 이전 입력값이 남지 않게 함
  if (!open) return null
  return <CreateProjectForm onClose={onClose} onSubmit={onSubmit} />
}

const FORM_ID = 'create-project-form'

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
    <Modal
      open
      title="프로젝트 만들기"
      onClose={onClose}
      actions={
        <>
          <Button variant="tonal" className={styles.cancel} onClick={onClose}>
            취소
          </Button>
          {/* 버튼이 폼 바깥(모달 푸터)에 있어서 form 속성으로 연결 */}
          <Button type="submit" form={FORM_ID} iconEnd="arrowRight" disabled={!trimmedName}>
            만들고 연결 설정으로
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className={styles.form} onSubmit={handleSubmit} noValidate>
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
      </form>
    </Modal>
  )
}
