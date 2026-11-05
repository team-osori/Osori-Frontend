import { useRef } from 'react'
import { Button, Card, CardHeader } from '../../components/ui'
import { FileItem } from '../../components/common'
import { POLICY_RULES } from '../policy/api'
import type { PolicyDoc } from './types'
import styles from './connection.module.css'

type PolicyDocsCardProps = {
  docs: PolicyDoc[]
  onAdd: (files: File[]) => void
  /** 올리는 중이면 버튼을 잠금 */
  uploading?: boolean
}

/** 질문 생성과 근거 확인에 쓰는 정책 문서 */
export function PolicyDocsCard({ docs, onAdd, uploading = false }: PolicyDocsCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Card className={styles.card}>
      <CardHeader title="정책 문서">
        질문 생성과 근거 확인에 사용
        <Button variant="tonal" size="xs" icon="upload" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? '올리는 중…' : '문서 추가'}
        </Button>
        {/* 파일 선택 창을 열기 위한 숨김 입력. 화면에는 위 버튼만 보임 */}
        <input
          ref={inputRef}
          className={styles.hiddenInput}
          type="file"
          accept={POLICY_RULES.fileAccept}
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length) onAdd(files)
            e.target.value = ''
          }}
        />
      </CardHeader>

      {docs.length ? (
        <div className={styles.docs}>
          {docs.map((doc) => (
            <FileItem key={doc.id} name={doc.name} meta={doc.meta} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>아직 추가한 문서가 없습니다. PDF · DOCX · TXT · MD (10MB 이하)</p>
      )}
    </Card>
  )
}
