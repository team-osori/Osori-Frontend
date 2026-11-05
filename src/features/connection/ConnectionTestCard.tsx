import { Button, Card, CardHeader, StatusDot, TextField } from '../../components/ui'
import { FileRef } from '../../components/common'
import type { ConnectionTestResult } from './types'
import styles from './connection.module.css'

type ConnectionTestCardProps = {
  question: string
  onQuestionChange: (value: string) => void
  onTest: () => void
  testing: boolean
  result: ConnectionTestResult | null
}

const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}초`

/** 실제 질문 하나를 보내 연결과 응답 경로를 확인 */
export function ConnectionTestCard({ question, onQuestionChange, onTest, testing, result }: ConnectionTestCardProps) {
  return (
    <Card className={styles.card}>
      <CardHeader title="연결 테스트" />
      <TextField
        label="테스트 질문"
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !testing) onTest()
        }}
        placeholder="챗봇에 보낼 질문"
      />
      <Button variant="tonal" size="sm" fullWidth onClick={onTest} disabled={testing}>
        {testing ? '요청 보내는 중…' : '테스트 요청 보내기'}
      </Button>

      {result && (
        <div className={styles.resultGroup} aria-live="polite">
          {result.ok ? (
            <>
              <p className={styles.result}>
                <StatusDot tone="success" size={8} />
                <span className={styles.resultOk}>{result.status} OK</span>
                <span className={styles.resultMeta}>
                  · {formatSeconds(result.elapsedMs)} · 청크 {result.chunks.length}개 반환
                </span>
              </p>
              <div className={styles.answer}>
                <span className={styles.answerLabel}>답변</span>
                <p className={styles.answerText}>{result.answer}</p>
              </div>
              <div className={styles.chunks}>
                <p className={styles.chunksLabel}>반환된 근거 청크</p>
                <ul className={styles.chunkList}>
                  {result.chunks.map((chunk) => (
                    <li key={chunk}>
                      <FileRef label={chunk} />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className={styles.result}>
              <StatusDot tone="danger" size={8} />
              <span className={styles.resultFail}>{result.status ?? '요청 실패'}</span>
              <span className={styles.resultMeta}>· {result.message}</span>
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
