import { Button, Card, CardHeader, CodeEditor, StatusDot, TextField } from '../../components/ui'
import type { EndpointForm } from './connectionForm'
import styles from './connection.module.css'

type EndpointErrors = Partial<Record<keyof EndpointForm | 'serviceName', string>>

type EndpointCardProps = {
  serviceName: string
  onServiceNameChange: (value: string) => void
  value: EndpointForm
  onChange: (patch: Partial<EndpointForm>) => void
  errors: EndpointErrors
  /** 서버에 인증 키가 저장돼 있는지 (키 값은 다시 받을 수 없음) */
  secretConfigured: boolean
  /** 저장된 설정이 있으면 지금 설정으로 연결 테스트를 통과했는지. 아직 저장 전이면 undefined */
  verified?: boolean
  dirty: boolean
  saving: boolean
  onSave: () => void
}

/** 평가할 챗봇 서비스의 호출 정보 */
export function EndpointCard({
  serviceName,
  onServiceNameChange,
  value,
  onChange,
  errors,
  secretConfigured,
  verified,
  dirty,
  saving,
  onSave,
}: EndpointCardProps) {
  return (
    <Card className={styles.card}>
      <CardHeader title="서비스 엔드포인트">
        {verified !== undefined && (
          <span className={styles.status}>
            <StatusDot tone={verified ? 'success' : 'neutral'} size={8} />
            {verified ? '연결 테스트 통과' : '연결 테스트 필요'}
          </span>
        )}
      </CardHeader>
      <div className={styles.fields}>
        <TextField
          label="서비스 이름"
          value={serviceName}
          onChange={(e) => onServiceNameChange(e.target.value)}
          placeholder="예: 모아몰 CS 챗봇"
          error={errors.serviceName}
          required
        />
        <TextField
          label="RAG 엔드포인트"
          type="url"
          inputMode="url"
          spellCheck={false}
          value={value.endpointUrl}
          onChange={(e) => onChange({ endpointUrl: e.target.value })}
          placeholder="https://"
          error={errors.endpointUrl}
          required
        />
        <TextField
          label="RAG 인증 키"
          prefix={value.authHeaderName || 'X-API-Key'}
          type="password"
          autoComplete="off"
          value={value.authKey}
          onChange={(e) => onChange({ authKey: e.target.value })}
          placeholder={secretConfigured ? '저장됨 · 바꿀 때만 입력' : '키 (선택)'}
        />
        {/* TODO: 백엔드에 RAG 서버로 넘길 두 번째 비밀값 API가 생기면 입력받아 저장 */}
        <TextField
          label="AI API 키 (OpenAI)"
          type="password"
          autoComplete="off"
          placeholder="준비 중"
          disabled
          hint="RAG가 답변 생성에 쓰는 키입니다. 서버 저장이 준비되면 입력할 수 있습니다."
        />
        <TextField
          label="응답에서 답변을 읽을 위치"
          mono
          spellCheck={false}
          value={value.answerPointer}
          onChange={(e) => onChange({ answerPointer: e.target.value })}
          placeholder="/answer"
          error={errors.answerPointer}
          required
        />
        <TextField
          label="응답에서 근거 문서를 읽을 위치 (선택)"
          mono
          spellCheck={false}
          value={value.retrievalPointer}
          onChange={(e) => onChange({ retrievalPointer: e.target.value })}
          placeholder="/contexts"
          error={errors.retrievalPointer}
        />
      </div>

      {/* 대부분은 기본값 그대로 쓰므로 접어 둠. 오류가 있으면 펼친 채로 보여줌 */}
      <details
        className={styles.details}
        open={Boolean(errors.requestTemplate || errors.questionPointer || errors.promptPointer || errors.authHeaderName) || undefined}
      >
        <summary className={styles.summary}>요청 형식</summary>
        <div className={styles.detailsBody}>
          <p className={styles.note}>
            RAG 서버에 보낼 요청 본문입니다. 아래 위치에 질문과 시스템 프롬프트를 넣어 보냅니다. 위치는 JSON Pointer(예: /question)로 적습니다.
          </p>
          <CodeEditor
            value={value.requestTemplate}
            onChange={(requestTemplate) => onChange({ requestTemplate })}
            minRows={4}
            aria-label="요청 본문 템플릿"
            aria-invalid={Boolean(errors.requestTemplate)}
          />
          {errors.requestTemplate && (
            <p className={styles.fieldError} role="alert">
              {errors.requestTemplate}
            </p>
          )}
          <div className={styles.fields}>
            <TextField
              label="질문을 넣을 위치"
              mono
              spellCheck={false}
              value={value.questionPointer}
              onChange={(e) => onChange({ questionPointer: e.target.value })}
              placeholder="/question"
              error={errors.questionPointer}
            />
            <TextField
              label="시스템 프롬프트를 넣을 위치"
              mono
              spellCheck={false}
              value={value.promptPointer}
              onChange={(e) => onChange({ promptPointer: e.target.value })}
              placeholder="/systemPrompt"
              error={errors.promptPointer}
            />
            <TextField
              label="인증 키를 보낼 헤더"
              mono
              spellCheck={false}
              value={value.authHeaderName}
              onChange={(e) => onChange({ authHeaderName: e.target.value })}
              placeholder="X-API-Key"
              error={errors.authHeaderName}
              hint="바꾸면 저장된 인증 키가 지워집니다."
            />
          </div>
        </div>
      </details>

      <div className={styles.actions}>
        <p className={styles.note}>저장하면 이전 연결 테스트 결과는 무효가 됩니다.</p>
        <Button size="sm" onClick={onSave} disabled={!dirty || saving}>
          {saving ? '저장하는 중…' : '저장'}
        </Button>
      </div>
    </Card>
  )
}
