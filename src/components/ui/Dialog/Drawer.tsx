import { useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../../lib/cx'
import type { IconName } from '../../../assets/icons'
import { Icon } from '../Icon/Icon'
import { useDialog } from './useDialog'
import styles from './Dialog.module.css'

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  /** 제목 앞 아이콘 */
  icon?: IconName
  description?: string
  children: ReactNode
}

/** 화면 오른쪽에서 열리는 패널 (목록 상세 등) */
export function Drawer({ open, onClose, title, icon, description, children }: DrawerProps) {
  const titleId = useId()
  const panelRef = useDialog(open, onClose)
  if (!open) return null

  return createPortal(
    <div className={cx(styles.overlay, styles.drawerOverlay)} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.header}>
          {icon && <Icon name={icon} />}
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>
        {description && <p className={styles.drawerDescription}>{description}</p>}
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
