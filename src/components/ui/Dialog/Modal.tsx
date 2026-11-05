import { useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../../lib/cx'
import { Icon } from '../Icon/Icon'
import { useDialog } from './useDialog'
import styles from './Dialog.module.css'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  /** sm 480 · md 520 · lg 640 · xl 760 (긴 글 읽기) */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** 제목 위 작은 글씨 (예: 챗봇 답변 · 프롬프트 v3). 있으면 머리 아래에 구분선 */
  eyebrow?: ReactNode
  children: ReactNode
  /** 하단 오른쪽 버튼들 */
  actions?: ReactNode
  /** 하단 왼쪽 (예: 질문 삭제) */
  secondaryAction?: ReactNode
  /** 제목 아래 영역 (예: 단계 표시) */
  subheader?: ReactNode
  /** 모서리에 얹는 장식 (예: 클립 스티커) */
  decoration?: ReactNode
}

/** 가운데 뜨는 확인·편집 창 */
export function Modal({ open, onClose, title, size = 'md', eyebrow, children, actions, secondaryAction, subheader, decoration }: ModalProps) {
  const titleId = useId()
  const panelRef = useDialog(open, onClose)
  if (!open) return null

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className={cx(styles.modal, styles[size], decoration != null && styles.decorated)} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={cx(styles.header, eyebrow != null && styles.headerDivided)}>
          <div className={styles.titles}>
            {eyebrow != null && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>
        {subheader && <div className={styles.subheader}>{subheader}</div>}
        {decoration && (
          <div className={styles.decoration} aria-hidden>
            {decoration}
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {(actions || secondaryAction) && (
          <div className={styles.footer}>
            {secondaryAction && <div className={styles.footerStart}>{secondaryAction}</div>}
            <div className={styles.footerEnd}>{actions}</div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** 모달 본문 문장 */
export function ModalText({ children }: { children: ReactNode }) {
  return <p className={styles.text}>{children}</p>
}
