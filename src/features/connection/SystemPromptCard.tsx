import { Card, CardHeader, CodeEditor, Tag } from '../../components/ui'
import styles from './connection.module.css'

type SystemPromptCardProps = {
  version: string
  value: string
  onChange: (value: string) => void
}

/** 기준이 되는 시스템 프롬프트 (이후 버전은 이 프롬프트와 비교) */
export function SystemPromptCard({ version, value, onChange }: SystemPromptCardProps) {
  return (
    <Card className={styles.card}>
      <CardHeader title="시스템 프롬프트">
        <Tag>{version}</Tag>
        이후 버전은 이 프롬프트를 기준으로 비교합니다
      </CardHeader>
      <CodeEditor
        value={value}
        onChange={onChange}
        minRows={6}
        aria-label="시스템 프롬프트"
        placeholder="챗봇에 적용 중인 시스템 프롬프트를 붙여 넣으세요."
      />
    </Card>
  )
}
