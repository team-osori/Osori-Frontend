import { useRef } from 'react'
import { Button, Card, CardHeader } from '../../components/ui'
import { FileItem } from '../../components/common'
import type { PolicyDoc } from './types'
import styles from './connection.module.css'

type PolicyDocsCardProps = {
  docs: PolicyDoc[]
  onAdd: (files: File[]) => void
}

/** 질문 생성과 근거 확인에 쓰는 정책 문서 */
export function PolicyDocsCard({ docs, onAdd }: PolicyDocsCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Card className={styles.card}>
      <CardHeader title="정책 문서">
        질문 생성과 근거 확인에 사용
        <Button variant="tonal" size="xs" icon="upload" onClick={() => inputRef.current?.click()}>
          문서 추가
        </Button>
        {/* 파일 선택 창을 열기 위한 숨김 입력. 화면에는 위 버튼만 보임 */}
        <input
          ref={inputRef}
          className={styles.hiddenInput}
          type="file"
          accept=".pdf,.md,.txt,.docx"
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
            <FileItem key={doc.id} name={doc.name} meta={doc.chunks == null ? '처리 중' : `청크 ${doc.chunks}개`} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>아직 추가한 문서가 없습니다.</p>
      )}
    </Card>
  )
}
