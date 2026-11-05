import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import type { IconName } from '../../assets/icons'
import { Button, Card, CardTitle, Icon, MultiSelect, StatTile, type SelectOption } from '../../components/ui'
import { Dropzone } from '../../components/common'
import { QUESTION_TYPES, type DraftCounts } from './types'
import styles from './questions.module.css'

function SourceCard({
  icon,
  title,
  description,
  highlight,
  children,
}: {
  icon: IconName
  title: string
  description: string
  highlight?: boolean
  children: ReactNode
}) {
  return (
    <Card className={cx(styles.source, highlight && styles.highlight)}>
      <span className={styles.sourceIcon} aria-hidden>
        <Icon name={icon} />
      </span>
      <div className={styles.sourceBody}>
        <div className={styles.sourceHead}>
          <CardTitle>{title}</CardTitle>
          <p className={styles.sourceDesc}>{description}</p>
        </div>
        {children}
      </div>
    </Card>
  )
}

/** CSV로 가진 질문 목록 올리기 */
export function UploadCard({ onFiles, message }: { onFiles: (files: File[]) => void; message?: { text: string; error?: boolean } }) {
  return (
    <SourceCard
      icon="uploadLg"
      title="질문 직접 업로드"
      description="가진 질문 목록을 CSV로 올립니다. 근거 청크 라벨이 없어 원인 진단 신뢰도가 낮아집니다."
    >
      <Dropzone
        title="CSV 파일을 끌어 놓거나 클릭해서 선택"
        hint="question, type, expected 열 필요"
        accept=".csv"
        onFiles={onFiles}
      />
      {message && (
        <p className={cx(styles.message, message.error && styles.error)} role={message.error ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
    </SourceCard>
  )
}

type DraftCardProps = {
  docOptions: SelectOption[]
  docs: string[]
  onDocsChange: (docs: string[]) => void
  counts: DraftCounts
  onCountsChange: (counts: DraftCounts) => void
  generating: boolean
  onGenerate: () => void
}

/** 정책 문서로 근거 청크가 연결된 질문 초안 만들기 */
export function DraftCard({ docOptions, docs, onDocsChange, counts, onCountsChange, generating, onGenerate }: DraftCardProps) {
  const total = QUESTION_TYPES.reduce((sum, t) => sum + counts[t], 0)
  return (
    <SourceCard
      icon="sparkle"
      title="AI로 초안 만들기"
      description="정책 문서를 고르고 유형별 개수를 정하면 근거 청크가 연결된 질문을 만듭니다."
      highlight
    >
      <MultiSelect
        icon="file"
        ariaLabel="초안에 쓸 정책 문서"
        placeholder="정책 문서를 선택하세요"
        options={docOptions}
        value={docs}
        onChange={onDocsChange}
        summary={(selected) =>
          selected.length > 1 ? `${selected[0].label} 외 ${selected.length - 1}개 문서` : selected[0].label
        }
      />
      <div className={styles.tiles}>
        {QUESTION_TYPES.map((type) => (
          <StatTile
            key={type}
            label={type}
            value={counts[type]}
            max={200}
            onChange={(n) => onCountsChange({ ...counts, [type]: n })}
          />
        ))}
      </div>
      <Button icon="sparkleSm" fullWidth onClick={onGenerate} disabled={generating || total === 0 || docs.length === 0}>
        {generating ? '초안 만드는 중…' : `질문 ${total}개 초안 생성`}
      </Button>
    </SourceCard>
  )
}
