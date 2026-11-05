import { errorMessage, isApiError } from '../../../lib/api/ApiError'
import { cx } from '../../../lib/cx'
import { Button } from '../../ui'
import styles from './ErrorNotice.module.css'

type ErrorNoticeProps = {
  error: unknown
  title?: string
  /** 주면 "다시 시도" 버튼을 보여줌 */
  onRetry?: () => void
  className?: string
}

/** API 요청 실패 안내. 문의할 때 쓸 수 있도록 요청 ID도 함께 보여줍니다. */
export function ErrorNotice({ error, title = '불러오지 못했습니다', onRetry, className }: ErrorNoticeProps) {
  const requestId = isApiError(error) ? error.requestId : undefined
  return (
    <div role="alert" className={cx(styles.notice, className)}>
      <div className={styles.text}>
        <p className={styles.title}>{title}</p>
        <p className={styles.message}>{errorMessage(error)}</p>
        {requestId && <span className={styles.requestId}>요청 ID {requestId}</span>}
      </div>
      {onRetry && (
        <Button variant="tonal" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  )
}
