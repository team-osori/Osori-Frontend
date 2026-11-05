import { useId, useState, type RefObject } from 'react'
import { cx } from '../../../lib/cx'
import { SearchInput } from '../../ui'
import type { ProjectStatus } from '../ProjectTable/ProjectTable'
import { STAGES } from '../../../routes'
import { PopoverAction, PopoverActions, PopoverList, PopoverOption, SidebarPopover } from './SidebarPopover'
import styles from './SidebarPopover.module.css'

/** 프로젝트 전환 목록에 필요한 최소 정보 (Project 타입과 호환) */
export type ProjectSwitchItem = {
  id: string
  name: string
  status: ProjectStatus
  /** 진행 중인 평가 단계(1~3) */
  currentStep: number
}

/** "3 / 3 · 오답 노트", 진행 중이면 "2 / 3 · 채점 진행 중" */
function progressOf(project: ProjectSwitchItem) {
  const step = STAGES[project.currentStep - 1]?.label ?? ''
  return `${project.currentStep} / ${STAGES.length} · ${step}${project.status === 'running' ? ' 진행 중' : ''}`
}

type ProjectSwitcherProps = {
  open: boolean
  onClose: () => void
  triggerRef: RefObject<HTMLElement | null>
  rootRef: RefObject<HTMLElement | null>
  projects: ProjectSwitchItem[]
  currentId?: string
  onSelect: (project: ProjectSwitchItem) => void
  onCreate: () => void
  onShowAll: () => void
}

/** 16 프로젝트 전환: 검색 · 프로젝트 목록 · 새 프로젝트 만들기 · 전체 프로젝트 보기 */
export function ProjectSwitcher({
  open,
  onClose,
  triggerRef,
  rootRef,
  projects,
  currentId,
  onSelect,
  onCreate,
  onShowAll,
}: ProjectSwitcherProps) {
  const [keyword, setKeyword] = useState('')
  const listId = useId()
  const query = keyword.trim().toLowerCase()
  const visible = query ? projects.filter((p) => p.name.toLowerCase().includes(query)) : projects

  function close() {
    setKeyword('')
    onClose()
  }

  function run(action: () => void) {
    close()
    action()
  }

  return (
    <SidebarPopover
      open={open}
      onClose={close}
      triggerRef={triggerRef}
      rootRef={rootRef}
      label="프로젝트 전환"
      gap={18}
    >
      <SearchInput
        tone="inset"
        placeholder="프로젝트 검색"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        aria-controls={listId}
        data-popover-item
        data-autofocus
      />
      <div id={listId} className={styles.listGap}>
        {visible.length > 0 ? (
          <PopoverList label="프로젝트">
            {visible.map((project) => {
              const selected = project.id === currentId
              return (
                <PopoverOption key={project.id} selected={selected} onSelect={() => run(() => onSelect(project))}>
                  <span className={styles.text}>
                    <span className={cx(styles.title, selected && styles.bold)}>{project.name}</span>
                    <span className={styles.sub}>{progressOf(project)}</span>
                  </span>
                </PopoverOption>
              )
            })}
          </PopoverList>
        ) : (
          <p className={styles.empty} role="status">
            검색 결과가 없습니다.
          </p>
        )}
      </div>
      <PopoverActions>
        <PopoverAction icon="plusSm" label="새 프로젝트 만들기" onClick={() => run(onCreate)} />
        <PopoverAction icon="gridSm" label="전체 프로젝트 보기" onClick={() => run(onShowAll)} />
      </PopoverActions>
    </SidebarPopover>
  )
}
