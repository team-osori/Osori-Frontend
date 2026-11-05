import type { RefObject } from 'react'
import { cx } from '../../../lib/cx'
import { PopoverAction, PopoverActions, PopoverList, PopoverOption, SidebarPopover } from './SidebarPopover'
import styles from './SidebarPopover.module.css'

/** 프롬프트 버전 (자동 채점 결과의 버전 목록과 같은 모양) */
export type PromptVersion = {
  /** 버전 이름 (v3) */
  version: string
  /** 이 버전에서 바꾼 내용 */
  title: string
  /** 만든 시각 (YYYY-MM-DD HH:mm) */
  createdAt: string
}

type PromptVersionPickerProps = {
  open: boolean
  onClose: () => void
  triggerRef: RefObject<HTMLElement | null>
  rootRef: RefObject<HTMLElement | null>
  /** 최신 버전이 맨 앞 */
  versions: PromptVersion[]
  value: string
  onChange: (value: string) => void
  onCreate: () => void
  onShowHistory: () => void
}

/** 17 프롬프트 버전 선택: 기준 버전 목록 · 새 버전 만들기 · 버전 기록 전체 보기 */
export function PromptVersionPicker({
  open,
  onClose,
  triggerRef,
  rootRef,
  versions,
  value,
  onChange,
  onCreate,
  onShowHistory,
}: PromptVersionPickerProps) {
  function run(action: () => void) {
    onClose()
    action()
  }

  return (
    <SidebarPopover
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      rootRef={rootRef}
      label="기준 버전 선택"
      gap={16}
      className={styles.wide}
    >
      <p className={styles.heading}>기준 버전</p>
      <PopoverList label="기준 버전">
        {versions.map((version, index) => {
          const selected = version.version === value
          return (
            <PopoverOption key={version.version} selected={selected} onSelect={() => run(() => onChange(version.version))}>
              <span className={cx(styles.pill, selected && styles.pillOn)}>{version.version}</span>
              <span className={styles.text}>
                <span className={styles.titleRow}>
                  <span className={styles.title}>{version.title}</span>
                  {index === 0 && <span className={styles.latest}>최신</span>}
                </span>
                <span className={styles.sub}>{version.createdAt}</span>
              </span>
            </PopoverOption>
          )
        })}
      </PopoverList>
      <PopoverActions>
        <PopoverAction icon="plusSm" label="새 버전 만들기" onClick={() => run(onCreate)} />
        <PopoverAction icon="fileText" label="버전 기록 전체 보기" onClick={() => run(onShowHistory)} />
      </PopoverActions>
    </SidebarPopover>
  )
}
