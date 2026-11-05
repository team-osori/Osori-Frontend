import { useId } from 'react'
import { Icon, Select, type SelectOption } from '../../ui'
import styles from './ProjectSelector.module.css'

type ProjectSelectorProps = {
  projectName: string
  promptOptions: SelectOption[]
  promptValue: string
  onPromptChange: (value: string) => void
  questionSet: string
  onProjectClick?: () => void
}

/** 프로젝트 사이드바 상단의 프로젝트 / 프롬프트 버전 / 질문 세트 카드 */
export function ProjectSelector({
  projectName,
  promptOptions,
  promptValue,
  onPromptChange,
  questionSet,
  onProjectClick,
}: ProjectSelectorProps) {
  const selectId = useId()
  return (
    <div className={styles.card}>
      {onProjectClick ? (
        <button type="button" className={styles.header} onClick={onProjectClick} aria-label={`${projectName} 프로젝트 변경`}>
          {projectName}
          <Icon name="chevronUpDown" />
        </button>
      ) : (
        <span className={styles.header}>{projectName}</span>
      )}
      <div className={styles.row}>
        <label className={styles.label} htmlFor={selectId}>
          프롬프트
        </label>
        <Select
          id={selectId}
          size="sm"
          fullWidth
          options={promptOptions}
          value={promptValue}
          onChange={onPromptChange}
        />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>질문 세트</span>
        <span className={styles.value}>{questionSet}</span>
      </div>
    </div>
  )
}
