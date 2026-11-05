import { cx } from '../../lib/cx'
import { Button, Icon, IconButton, Tag } from '../../components/ui'
import type { Question } from './types'
import styles from './questions.module.css'

type QuestionTableProps = {
  questions: Question[]
  onApprove: (id: string, approved: boolean) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
  /** 수정 모달 열기 */
  onEdit: (question: Question) => void
}

/** 질문 목록. 좁은 화면에서는 카드형으로 바뀝니다 */
export function QuestionTable({ questions, onApprove, onDelete, onRestore, onEdit }: QuestionTableProps) {
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
            const deleted = q.status === 'deleted'
            return (
              <tr key={q.id} className={cx(deleted && styles.deleted)}>
                <td className={styles.question}>{q.text}</td>
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
                <td data-label="기대 동작">{q.expected}</td>
                <td>
                  <div className={styles.actions}>
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
                    <IconButton icon="pencil" label={`"${q.text}" 수정`} disabled={deleted} onClick={() => onEdit(q)} />
                    <IconButton icon="trashSm" label={`"${q.text}" 삭제`} disabled={deleted} onClick={() => onDelete(q.id)} />
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
