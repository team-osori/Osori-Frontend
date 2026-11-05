import { useRef, useState, type DragEvent } from 'react'
import { cx } from '../../../lib/cx'
import { Icon } from '../../ui'
import styles from './Dropzone.module.css'

type DropzoneProps = {
  title: string
  hint?: string
  /** 예: ".csv" */
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
}

/** 파일을 끌어 놓거나 클릭해서 고르는 영역 */
export function Dropzone({ title, hint, accept, multiple, onFiles }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const accepts = (file: File) =>
    !accept || accept.split(',').some((ext) => file.name.toLowerCase().endsWith(ext.trim().toLowerCase()))

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(accepts)
    if (files.length) onFiles(multiple ? files : files.slice(0, 1))
  }

  return (
    <>
      <button
        type="button"
        className={cx(styles.zone, dragging && styles.dragging)}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Icon name="uploadLg" />
        <span className={styles.title}>{title}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </button>
      {/* 파일 선택 창을 열기 위한 숨김 입력 */}
      <input
        ref={inputRef}
        className={styles.hiddenInput}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
    </>
  )
}
