import { useId, useRef, useState } from 'react'
import { cx } from '../../../lib/cx'
import { Icon, Select, type SelectOption } from '../../ui'
import { ProjectSwitcher, type ProjectSwitchItem } from './ProjectSwitcher'
import { PromptVersionPicker, type PromptVersion } from './PromptVersionPicker'
import styles from './ProjectSelector.module.css'

/** 프로젝트 전환 팝오버 설정. 주면 프로젝트 이름을 눌러 다른 프로젝트로 바꿀 수 있습니다. */
export type ProjectSwitchOptions = {
  projects: ProjectSwitchItem[]
  currentId?: string
  onSelect: (project: ProjectSwitchItem) => void
  onCreate: () => void
  onShowAll: () => void
}

/** 프롬프트 버전 팝오버 설정. 주면 Select 대신 버전 기록 팝오버를 엽니다. */
export type PromptVersionOptions = {
  versions: PromptVersion[]
  onCreate: () => void
  onShowHistory: () => void
}

type Menu = 'project' | 'prompt'

type ProjectSelectorProps = {
  projectName: string
  promptOptions: SelectOption[]
  promptValue: string
  onPromptChange: (value: string) => void
  questionSet: string
  onProjectClick?: () => void
  projectSwitch?: ProjectSwitchOptions
  promptVersions?: PromptVersionOptions
}

/** 프로젝트 사이드바 상단의 프로젝트 / 프롬프트 버전 / 질문 세트 카드 */
export function ProjectSelector({
  projectName,
  promptOptions,
  promptValue,
  onPromptChange,
  questionSet,
  onProjectClick,
  projectSwitch,
  promptVersions,
}: ProjectSelectorProps) {
  const selectId = useId()
  const labelId = useId()
  const projectRef = useRef<HTMLButtonElement>(null)
  const promptRef = useRef<HTMLButtonElement>(null)
  const [openMenu, setOpenMenu] = useState<Menu | null>(null)
  const close = () => setOpenMenu(null)
  const toggle = (menu: Menu) => setOpenMenu((prev) => (prev === menu ? null : menu))

  const currentVersion = promptVersions?.versions.find((v) => v.value === promptValue)
  const promptLabel = currentVersion ? `${currentVersion.value}${currentVersion.latest ? ' (최신)' : ''}` : promptValue

  return (
    <div className={styles.card}>
      {projectSwitch ? (
        <button
          ref={projectRef}
          type="button"
          className={styles.header}
          onClick={() => toggle('project')}
          aria-haspopup="dialog"
          aria-expanded={openMenu === 'project'}
          aria-label={`${projectName} · 프로젝트 전환`}
        >
          {projectName}
          <Icon name="chevronUpDown" />
        </button>
      ) : onProjectClick ? (
        <button type="button" className={styles.header} onClick={onProjectClick} aria-label={`${projectName} 프로젝트 변경`}>
          {projectName}
          <Icon name="chevronUpDown" />
        </button>
      ) : (
        <span className={styles.header}>{projectName}</span>
      )}
      <div className={styles.row}>
        {promptVersions ? (
          <>
            <span id={labelId} className={styles.label}>
              프롬프트
            </span>
            <div>
              <button
                ref={promptRef}
                type="button"
                className={cx(styles.promptTrigger, openMenu === 'prompt' && styles.promptOpen)}
                onClick={() => toggle('prompt')}
                aria-haspopup="dialog"
                aria-expanded={openMenu === 'prompt'}
                aria-labelledby={`${labelId} ${selectId}`}
              >
                <span id={selectId} className={styles.promptValue}>
                  {promptLabel}
                </span>
                <Icon name="chevronDown" className={styles.chevron} />
              </button>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
      <div className={styles.row}>
        <span className={styles.label}>질문 세트</span>
        <span className={styles.value}>{questionSet}</span>
      </div>

      {/* 트리거를 바깥 클릭 판정에서 빼야 트리거를 다시 눌렀을 때 닫혔다 바로 열리지 않음 */}
      {projectSwitch && (
        <ProjectSwitcher
          open={openMenu === 'project'}
          onClose={close}
          triggerRef={projectRef}
          rootRef={projectRef}
          projects={projectSwitch.projects}
          currentId={projectSwitch.currentId}
          onSelect={projectSwitch.onSelect}
          onCreate={projectSwitch.onCreate}
          onShowAll={projectSwitch.onShowAll}
        />
      )}
      {promptVersions && (
        <PromptVersionPicker
          open={openMenu === 'prompt'}
          onClose={close}
          triggerRef={promptRef}
          rootRef={promptRef}
          versions={promptVersions.versions}
          value={promptValue}
          onChange={onPromptChange}
          onCreate={promptVersions.onCreate}
          onShowHistory={promptVersions.onShowHistory}
        />
      )}
    </div>
  )
}
