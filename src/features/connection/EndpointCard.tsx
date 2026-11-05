import { Card, CardHeader, TextField } from '../../components/ui'
import type { ConnectionConfig } from './types'
import styles from './connection.module.css'

type EndpointFields = Pick<ConnectionConfig, 'serviceName' | 'endpointUrl' | 'authToken' | 'responsePath'>

type EndpointCardProps = {
  value: EndpointFields
  onChange: (patch: Partial<EndpointFields>) => void
}

/** 평가할 챗봇 서비스의 호출 정보 */
export function EndpointCard({ value, onChange }: EndpointCardProps) {
  return (
    <Card className={styles.card}>
      <CardHeader title="서비스 엔드포인트" />
      <div className={styles.fields}>
        <TextField
          label="서비스 이름"
          value={value.serviceName}
          onChange={(e) => onChange({ serviceName: e.target.value })}
          placeholder="예: 모아몰 CS 챗봇"
          required
        />
        <TextField
          label="엔드포인트 URL"
          type="url"
          inputMode="url"
          value={value.endpointUrl}
          onChange={(e) => onChange({ endpointUrl: e.target.value })}
          placeholder="https://"
          required
        />
        <TextField
          label="인증 헤더"
          prefix="Authorization: Bearer"
          type="password"
          autoComplete="off"
          value={value.authToken}
          onChange={(e) => onChange({ authToken: e.target.value })}
          placeholder="토큰"
        />
        <TextField
          label="응답 경로 (답변 · 근거 청크)"
          mono
          value={value.responsePath}
          onChange={(e) => onChange({ responsePath: e.target.value })}
          placeholder="$.answer · $.contexts[]"
          required
        />
      </div>
    </Card>
  )
}
