import type { RefObject } from 'react'
import { cx } from '../../../lib/cx'
import { PopoverAction, PopoverActions, PopoverList, PopoverOption, SidebarPopover } from './SidebarPopover'
import styles from './SidebarPopover.module.css'

export type PromptVersion = {
  /** 버전 이름 (v3) */
  value: string
  /** 이 버전에서 바꾼 내용 */
  title: string
  /** 만든 시각 (YYYY-MM-DD HH:mm) */
  createdAt: string
  latest?: boolean
}

type PromptVersionPickerProps = {
  open: boolean
  onClose: () => void
  triggerRef: RefObject<HTMLElement | null>
  rootRef: RefObject<HTMLElement | null>
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
        {versions.map((version) => {
          const selected = version.value === value
          return (
            <PopoverOption key={version.value} selected={selected} onSelect={() => run(() => onChange(version.value))}>
              <span className={cx(styles.pill, selected && styles.pillOn)}>{version.value}</span>
              <span className={styles.text}>
                <span className={styles.titleRow}>
                  <span className={styles.title}>{version.title}</span>
                  {version.latest && <span className={styles.latest}>최신</span>}
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
