import { Button, Card, CardHeader, CodeEditor, Tag } from '../../components/ui'
import styles from './connection.module.css'

type SystemPromptCardProps = {
  /** 저장된 최신 버전 번호. 아직 저장한 적 없으면 undefined */
  version?: number
  value: string
  onChange: (value: string) => void
  dirty: boolean
  saving: boolean
  onSave: () => void
}

/** 기준이 되는 시스템 프롬프트. 저장할 때마다 새 버전이 생기고, 이전 버전은 그대로 남습니다. */
export function SystemPromptCard({ version, value, onChange, dirty, saving, onSave }: SystemPromptCardProps) {
  return (
    <Card className={styles.card}>
      <CardHeader title="시스템 프롬프트">
        {version !== undefined && <Tag>v{version}</Tag>}
        이후 버전은 이 프롬프트를 기준으로 비교합니다
      </CardHeader>
      <CodeEditor
        value={value}
        onChange={onChange}
        minRows={6}
        aria-label="시스템 프롬프트"
        placeholder="챗봇에 적용 중인 시스템 프롬프트를 붙여 넣으세요."
      />
      <div className={styles.actions}>
        <p className={styles.note}>{version === undefined ? '저장하면 v1이 됩니다.' : `저장하면 v${version + 1}로 새 버전이 생깁니다.`}</p>
        <Button size="sm" onClick={onSave} disabled={!dirty || saving || !value.trim()}>
          {saving ? '저장하는 중…' : '저장'}
        </Button>
      </div>
    </Card>
  )
}
