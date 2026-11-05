import { useEffect, useId, useState } from 'react'
import { Button, Chip, ChipList, Field, Modal, SegmentedControl, TextArea } from '../../components/ui'
import { ChunkPicker } from './ChunkPicker'
import { QUESTION_TYPES, type Question } from './types'
import styles from './questions.module.css'

export type QuestionEdit = Pick<Question, 'text' | 'type' | 'chunks' | 'expected'>

type QuestionEditModalProps = {
  /** null이면 닫힘 */
  question: Question | null
  chunkOptions: string[]
  onClose: () => void
  onSave: (id: string, edit: QuestionEdit) => void
  onDelete: (id: string) => void
}

/** 질문 · 유형 · 근거 청크 · 기대 동작 수정 */
export function QuestionEditModal({ question, chunkOptions, onClose, onSave, onDelete }: QuestionEditModalProps) {
  const [draft, setDraft] = useState<QuestionEdit | null>(null)
  const typeId = useId()

  // 다른 질문을 열면 그 질문 값으로 초기화
  useEffect(() => {
    setDraft(question && { text: question.text, type: question.type, chunks: question.chunks, expected: question.expected })
  }, [question])

  if (!question || !draft) return null
  const canSave = draft.text.trim() !== ''

  const save = () => {
    if (!canSave) return
    onSave(question.id, { ...draft, text: draft.text.trim(), expected: draft.expected.trim() })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="질문 수정"
      size="lg"
      secondaryAction={
        <Button variant="dangerText" icon="trashDangerSm" onClick={() => onDelete(question.id)}>
          질문 삭제
        </Button>
      }
      actions={
        <>
          <Button variant="tonal" onClick={onClose}>
            취소
          </Button>
          <Button onClick={save} disabled={!canSave}>
            저장
          </Button>
        </>
      }
    >
      <TextArea label="질문" size="sm" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />

      <Field label="유형" htmlFor={typeId}>
        <SegmentedControl
          id={typeId}
          ariaLabel="질문 유형"
          options={QUESTION_TYPES}
          value={draft.type}
          onChange={(type) => setDraft({ ...draft, type })}
        />
      </Field>

      <div>
        <p className={styles.fieldLabel}>근거 청크</p>
        <ChipList label="연결된 근거 청크">
          {draft.chunks.map((chunk) => (
            <Chip
              key={chunk}
              icon="fileChip"
              label={chunk}
              onRemove={() => setDraft({ ...draft, chunks: draft.chunks.filter((c) => c !== chunk) })}
            />
          ))}
          <ChunkPicker
            options={chunkOptions}
            linked={draft.chunks}
            onPick={(chunk) => setDraft({ ...draft, chunks: [...draft.chunks, chunk] })}
          />
        </ChipList>
      </div>

      <TextArea label="기대 동작" value={draft.expected} onChange={(e) => setDraft({ ...draft, expected: e.target.value })} />
    </Modal>
  )
}
