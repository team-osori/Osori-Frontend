import { useRef, type TextareaHTMLAttributes } from 'react'
import { cx } from '../../../lib/cx'
import styles from './CodeEditor.module.css'

type CodeEditorProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'rows'> & {
  value: string
  onChange: (value: string) => void
  /** 최소 표시 줄 수 */
  minRows?: number
}

/** 줄 번호가 붙는 고정폭 편집기 (시스템 프롬프트 등). 내용 길이에 맞춰 높이가 늘어남 */
export function CodeEditor({ value, onChange, minRows = 4, className, ...rest }: CodeEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const lineCount = Math.max(minRows, value.split('\n').length)

  return (
    <div className={cx(styles.editor, className)} onClick={() => ref.current?.focus()}>
      <ol className={styles.gutter} aria-hidden>
        {Array.from({ length: lineCount }, (_, i) => (
          <li key={i}>{i + 1}</li>
        ))}
      </ol>
      <textarea
        ref={ref}
        className={styles.input}
        value={value}
        rows={lineCount}
        spellCheck={false}
        wrap="off"
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </div>
  )
}
