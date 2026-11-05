import { Button, Card, CardTitle } from '../../ui'
import styles from './DangerZone.module.css'

type DangerZoneProps = {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function DangerZone({
  title = '프로젝트 삭제',
  description = '프롬프트 버전, 질문 세트, 평가 기록이 모두 휴지통으로 이동하고 30일 뒤 영구 삭제됩니다.',
  actionLabel = '프로젝트 삭제',
  onAction,
}: DangerZoneProps) {
  return (
    <Card tone="danger" className={styles.zone}>
      <div className={styles.text}>
        <CardTitle tone="danger">{title}</CardTitle>
        <p className={styles.description}>{description}</p>
      </div>
      <Button variant="danger" icon="trashDanger" onClick={onAction}>
        {actionLabel}
      </Button>
    </Card>
  )
}
