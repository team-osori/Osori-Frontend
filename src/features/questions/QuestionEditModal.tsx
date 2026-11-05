import { useEffect, useId, useState } from 'react'
import { Button, Chip, ChipList, Field, Modal, SegmentedControl, TextArea } from '../../components/ui'
import { ChunkPicker } from './ChunkPicker'
import type { QuestionEdit } from './questionView'
import { CATEGORY_LABEL, CATEGORY_OF, QUESTION_TYPES, type EvidenceOption, type Question, type QuestionType } from './types'
import styles from './questions.module.css'

type QuestionEditModalProps = {
  /** null이면 닫힘 */
  question: Question | null
  evidenceOptions: EvidenceOption[]
  saving?: boolean
  onClose: () => void
  onSave: (id: string, edit: QuestionEdit) => void
  onDelete: (id: string) => void
}

/** 질문 · 유형 · 근거 · 모범 답안 수정. 저장하면 다시 검토가 필요합니다. */
export function QuestionEditModal({ question, evidenceOptions, saving = false, onClose, onSave, onDelete }: QuestionEditModalProps) {
  const [draft, setDraft] = useState<QuestionEdit | null>(null)
  const typeId = useId()

  // 다른 질문을 열면 그 질문 값으로 초기화
  useEffect(() => {
    setDraft(question && { text: question.text, category: question.category, evidence: question.evidence, expected: question.expected })
  }, [question])

  if (!question || !draft) return null

  const labelOf = (value: string) => evidenceOptions.find((o) => o.value === value)?.label ?? value.split(':')[1]
  // 근거는 한 정책 문서(버전)의 규칙끼리만 함께 연결할 수 있음
  const linkedPolicy = draft.evidence[0]?.split(':')[0]
  const pickable = linkedPolicy ? evidenceOptions.filter((o) => o.policyVersionId === linkedPolicy) : evidenceOptions
  const typeLabel = CATEGORY_LABEL[draft.category] as QuestionType
  const canSave = draft.text.trim() !== '' && !saving

  const save = () => {
    if (canSave) onSave(question.id, draft)
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
            {saving ? '저장하는 중…' : '저장'}
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
          // 예전 유형(예외 · 경계)은 고르기 전까지 아무것도 선택되지 않은 것으로 보임
          value={(QUESTION_TYPES as readonly string[]).includes(typeLabel) ? typeLabel : (undefined as unknown as QuestionType)}
          onChange={(type) => setDraft({ ...draft, category: CATEGORY_OF[type] })}
        />
      </Field>
      <div>
        <p className={styles.fieldLabel}>근거</p>
        <ChipList label="연결된 근거">
          {draft.evidence.map((value) => (
            <Chip
              key={value}
              icon="fileChip"
              label={labelOf(value)}
              onRemove={() => setDraft({ ...draft, evidence: draft.evidence.filter((v) => v !== value) })}
            />
          ))}
          <ChunkPicker options={pickable} linked={draft.evidence} onPick={(value) => setDraft({ ...draft, evidence: [...draft.evidence, value] })} />
        </ChipList>
        {draft.evidence.length === 0 && <p className={styles.note}>근거를 연결해야 승인할 수 있습니다.</p>}
      </div>
      <TextArea label="모범 답안" value={draft.expected} onChange={(e) => setDraft({ ...draft, expected: e.target.value })} />
      <p className={styles.note}>저장하면 이 질문은 다시 검토 필요 상태가 됩니다.</p>
    </Modal>
  )
}
