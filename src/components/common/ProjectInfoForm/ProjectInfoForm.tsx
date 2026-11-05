import { useEffect, useState, type FormEvent } from 'react'
import { Button, Card, CardTitle, Field, StatusDot, TextArea, TextField } from '../../ui'
import styles from './ProjectInfoForm.module.css'

export type ProjectInfo = { name: string; description: string }

type ProjectInfoFormProps = {
  /** 프로젝트가 바뀌면 입력 중이던 값을 버리고 새 값으로 초기화 */
  projectId: string
  initialValue: ProjectInfo
  serviceLabel: string
  serviceConnected?: boolean
  onChangeService?: () => void
  onSubmit: (projectId: string, value: ProjectInfo) => void
}

/** 프로젝트 설정 > 일반 탭의 기본 정보 카드 */
export function ProjectInfoForm({
  projectId,
  initialValue,
  serviceLabel,
  serviceConnected = true,
  onChangeService,
  onSubmit,
}: ProjectInfoFormProps) {
  const [value, setValue] = useState(initialValue)

  // 다른 프로젝트로 바뀌거나 데이터가 나중에 도착하면 폼 값도 갱신
  const { name, description } = initialValue
  useEffect(() => {
    setValue({ name, description })
  }, [projectId, name, description])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(projectId, value)
  }

  return (
    <Card>
      <form className={styles.form} onSubmit={handleSubmit}>
        <CardTitle>기본 정보</CardTitle>
        <TextField
          label="프로젝트 이름"
          value={value.name}
          onChange={(e) => setValue({ ...value, name: e.target.value })}
          required
        />
        <TextArea
          label="설명"
          value={value.description}
          onChange={(e) => setValue({ ...value, description: e.target.value })}
        />
        <Field label="연결된 서비스">
          <div className={styles.service}>
            <StatusDot tone={serviceConnected ? 'success' : 'neutral'} size={8} />
            <span className={styles.serviceName}>{serviceLabel}</span>
            <button type="button" className={styles.link} onClick={onChangeService}>
              연결 변경
            </button>
          </div>
        </Field>
        <div className={styles.actions}>
          <Button type="submit">변경 사항 저장</Button>
        </div>
      </form>
    </Card>
  )
}
