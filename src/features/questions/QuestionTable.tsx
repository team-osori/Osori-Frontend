import { useState } from 'react'
import { cx } from '../../lib/cx'
import { Button, Icon, IconButton, Tag } from '../../components/ui'
import type { Question } from './types'
import styles from './questions.module.css'

type QuestionTableProps = {
  questions: Question[]
  onApprove: (id: string, approved: boolean) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
  onEdit: (id: string, patch: Pick<Question, 'text' | 'expected'>) => void
}

/** 질문 목록. 좁은 화면에서는 카드형으로 바뀝니다 */
export function QuestionTable({ questions, onApprove, onDelete, onRestore, onEdit }: QuestionTableProps) {
  const [editing, setEditing] = useState<{ id: string; text: string; expected: string } | null>(null)

  const save = () => {
    if (!editing || !editing.text.trim()) return
    onEdit(editing.id, { text: editing.text.trim(), expected: editing.expected.trim() })
    setEditing(null)
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <colgroup>
          <col className={styles.colQuestion} />
          <col className={styles.colType} />
          <col className={styles.colSource} />
          <col className={styles.colChunk} />
          <col className={styles.colExpected} />
          <col className={styles.colActions} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">질문</th>
            <th scope="col">유형</th>
            <th scope="col">출처</th>
            <th scope="col">연결된 근거 청크</th>
            <th scope="col">기대 동작</th>
            <th scope="col">
              <span className="sr-only">작업</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {questions.length === 0 && (
            <tr className={styles.emptyRow}>
              <td colSpan={6}>조건에 맞는 질문이 없습니다.</td>
            </tr>
          )}
          {questions.map((q) => {
            const isEditing = editing?.id === q.id
            const deleted = q.status === 'deleted'
            return (
              <tr key={q.id} className={cx(deleted && styles.deleted)}>
                <td className={styles.question}>
                  {isEditing ? (
                    <input
                      className={styles.editInput}
                      aria-label="질문"
                      autoFocus
                      value={editing.text}
                      onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') save()
                        if (e.key === 'Escape') setEditing(null)
                      }}
                    />
                  ) : (
                    q.text
                  )}
                </td>
                <td data-label="유형">
                  <Tag strong={false}>{q.type}</Tag>
                </td>
                <td data-label="출처">{q.source}</td>
                <td data-label="근거 청크">
                  {q.chunks.length ? (
                    <span className={styles.chunk}>
                      <Icon name="fileXs" />
                      {q.chunks[0]}
                      {q.chunks.length > 1 && <span className={styles.more}>외 {q.chunks.length - 1}</span>}
                    </span>
                  ) : (
                    <span className={styles.noLabel}>
                      <Icon name="warning" />
                      라벨 없음
                    </span>
                  )}
                </td>
                <td data-label="기대 동작">
                  {isEditing ? (
                    <input
                      className={styles.editInput}
                      aria-label="기대 동작"
                      value={editing.expected}
                      onChange={(e) => setEditing({ ...editing, expected: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') save()
                        if (e.key === 'Escape') setEditing(null)
                      }}
                    />
                  ) : (
                    q.expected
                  )}
                </td>
                <td>
                  <div className={styles.actions}>
                    {isEditing ? (
                      <>
                        <Button size="xxs" onClick={save} disabled={!editing.text.trim()}>
                          저장
                        </Button>
                        <Button size="xxs" variant="tonal" onClick={() => setEditing(null)}>
                          취소
                        </Button>
                      </>
                    ) : (
                      <>
                        {deleted ? (
                          <Button size="xxs" variant="tonal" icon="restore" className={styles.invertIcon} onClick={() => onRestore(q.id)}>
                            복원
                          </Button>
                        ) : q.status === 'approved' ? (
                          <Button
                            size="xxs"
                            variant="success"
                            icon="checkSuccess"
                            aria-pressed
                            title="다시 누르면 미검토로 돌아갑니다"
                            onClick={() => onApprove(q.id, false)}
                          >
                            승인됨
                          </Button>
                        ) : (
                          <Button size="xxs" icon="checkDark" onClick={() => onApprove(q.id, true)}>
                            승인
                          </Button>
                        )}
                        <IconButton
                          icon="pencil"
                          label={`"${q.text}" 수정`}
                          disabled={deleted}
                          onClick={() => setEditing({ id: q.id, text: q.text, expected: q.expected })}
                        />
                        <IconButton icon="trashSm" label={`"${q.text}" 삭제`} disabled={deleted} onClick={() => onDelete(q.id)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
