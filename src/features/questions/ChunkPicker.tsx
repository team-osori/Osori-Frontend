import { useCallback, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/cx'
import { Button, Icon } from '../../components/ui'
import { usePopover } from '../../components/ui/Select/usePopover'
import styles from './questions.module.css'

type ChunkPickerProps = {
  /** 연결할 수 있는 근거 전체 */
  options: { value: string; label: string }[]
  /** 이미 연결된 청크 (목록에서 제외) */
  linked: string[]
  onPick: (value: string) => void
}

/** "청크 연결" 버튼 + 고를 수 있는 청크 목록 */
export function ChunkPicker({ options, linked, onPick }: ChunkPickerProps) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const close = useCallback(() => setOpen(false), [])
  const style = usePopover({ open, onClose: close, triggerRef, rootRef, popoverRef: listRef })

  const available = options.filter((o) => !linked.includes(o.value))

  const pick = (index: number) => {
    const option = available[index]
    if (!option) return
    onPick(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((i) => Math.min(available.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(highlight)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={styles.picker}>
      <Button
        ref={triggerRef}
        variant="outline"
        size="xs"
        icon="plusXs"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={available.length === 0}
        onClick={() => {
          setHighlight(0)
          setOpen((o) => !o)
        }}
        onKeyDown={onKeyDown}
      >
        근거 연결
      </Button>
      {open &&
        createPortal(
          <ul ref={listRef} id={listId} role="listbox" aria-label="연결할 근거 청크" className={styles.pickerList} style={style}>
            {available.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={index === highlight}
                className={cx(styles.pickerOption, index === highlight && styles.pickerHighlighted)}
                onPointerEnter={() => setHighlight(index)}
                onClick={() => pick(index)}
              >
                <Icon name="fileChip" />
                {option.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  )
}
