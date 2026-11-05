import { Button, Card, CardHeader, StatusDot, TextField } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { CONNECTION_RULES, type ConnectionTest } from './connectionApi'
import styles from './connection.module.css'

type ConnectionTestCardProps = {
  question: string
  onQuestionChange: (value: string) => void
  onTest: () => void
  testing: boolean
  /** 진행 중에도 서버가 알려준 상태로 갱신됨 */
  result: ConnectionTest | null
  /** 테스트를 요청하지 못한 오류 (서버가 FAILED로 끝낸 경우는 result에 담김) */
  error?: unknown
  /** 테스트할 수 없는 이유. 있으면 버튼을 잠그고 이 문구를 보여줌 */
  disabledReason?: string
}

const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}초`

/** 서버가 알려주는 실행 오류 코드를 사람이 읽을 문구로 */
const ERROR_TEXT: Record<string, string> = {
  UPSTREAM_TIMEOUT: '챗봇이 제한 시간 안에 답하지 않았습니다.',
  UPSTREAM_AUTH_FAILED: '챗봇이 인증을 거절했습니다. 인증 토큰을 확인해 주세요.',
  UPSTREAM_RATE_LIMITED: '챗봇이 요청이 많다며 거절했습니다. 잠시 후 다시 시도해 주세요.',
  UPSTREAM_HTTP_ERROR: '챗봇이 오류 응답을 보냈습니다.',
  UPSTREAM_CONNECTION_FAILED: '챗봇 주소에 연결하지 못했습니다.',
  INVALID_UPSTREAM_RESPONSE: '응답에서 답변을 찾지 못했습니다. 답변 위치를 확인해 주세요.',
  UPSTREAM_RESPONSE_TOO_LARGE: '응답이 너무 큽니다. (최대 1MiB)',
  UNSAFE_ENDPOINT: '호출할 수 없는 주소입니다. 공개된 https 주소인지 확인해 주세요.',
  CONNECTION_CHANGED: '테스트 도중 연결 설정이 바뀌었습니다. 다시 시도해 주세요.',
  WORKER_INTERRUPTED: '테스트가 중간에 멈췄습니다. 다시 시도해 주세요.',
}

function failureText(result: ConnectionTest) {
  const code = result.error?.code
  return (code && ERROR_TEXT[code]) || result.error?.message || '연결 테스트에 실패했습니다.'
}

/** 실제 질문 하나를 보내 연결과 답변 위치를 확인 */
export function ConnectionTestCard({ question, onQuestionChange, onTest, testing, result, error, disabledReason }: ConnectionTestCardProps) {
  const disabled = testing || Boolean(disabledReason) || !question.trim()
  const done = result && (result.status === 'SUCCEEDED' || result.status === 'FAILED')

  return (
    <Card className={styles.card}>
      <CardHeader title="연결 테스트" />
      <TextField
        label="테스트 질문"
        value={question}
        maxLength={CONNECTION_RULES.questionMax}
        onChange={(e) => onQuestionChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !disabled) onTest()
        }}
        placeholder="챗봇에 보낼 질문"
      />
      <Button variant="tonal" size="sm" fullWidth onClick={onTest} disabled={disabled}>
        {testing ? (result?.status === 'RUNNING' ? '챗봇 응답 기다리는 중…' : '요청 보내는 중…') : '테스트 요청 보내기'}
      </Button>
      {disabledReason && <p className={styles.note}>{disabledReason}</p>}

      <div className={styles.resultGroup} aria-live="polite">
        {error !== undefined && !testing && (
          <p className={styles.result}>
            <StatusDot tone="danger" size={8} />
            <span className={styles.resultFail}>요청 실패</span>
            <span className={styles.resultMeta}>· {errorMessage(error)}</span>
          </p>
        )}
        {done && result.status === 'SUCCEEDED' && (
          <>
            <p className={styles.result}>
              <StatusDot tone="success" size={8} />
              <span className={styles.resultOk}>연결 성공</span>
              <span className={styles.resultMeta}>
                {result.latencyMs != null && ` · ${formatSeconds(result.latencyMs)}`} · 시도 {result.attemptCount}회
              </span>
            </p>
            <div className={styles.answer}>
              <span className={styles.answerLabel}>답변</span>
              <p className={styles.answerText}>{result.answer}</p>
            </div>
          </>
        )}
        {done && result.status === 'FAILED' && (
          <p className={styles.result}>
            <StatusDot tone="danger" size={8} />
            <span className={styles.resultFail}>연결 실패</span>
            <span className={styles.resultMeta}>· {failureText(result)}</span>
          </p>
        )}
      </div>
    </Card>
  )
}
