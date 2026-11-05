import type { FormEvent, ReactNode } from 'react'
import { AuthBrandPanel } from '../components/common'
import { Button } from '../components/ui'
import styles from './AuthLayout.module.css'

type AuthLayoutProps = {
  title: string
  subtitle: string
  /** 폼 제출 버튼 글자 */
  submitLabel: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  /** 입력창들 */
  children: ReactNode
  /** 제출 버튼 아래 영역 (다른 화면으로 가는 링크, 안내 문구 등) */
  footer?: ReactNode
  submitting?: boolean
}

/** 로그인·회원가입 공통 화면: 좌측 브랜드 패널 + 우측 폼 */
export function AuthLayout({ title, subtitle, submitLabel, onSubmit, children, footer, submitting }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <AuthBrandPanel connected />
      </div>

      <div className={styles.formSide}>
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <header className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </header>

          <div className={styles.fields}>{children}</div>

          <Button type="submit" size="lg" fullWidth disabled={submitting}>
            {submitLabel}
          </Button>

          {footer}
        </form>
      </div>
    </div>
  )
}

/** "계정이 없으신가요? 회원가입" 같은 화면 전환 안내 */
export function AuthSwitch({ prompt, linkLabel, href }: { prompt: string; linkLabel: string; href: string }) {
  return (
    <p className={styles.switch}>
      {prompt}{' '}
      <a className={styles.switchLink} href={href}>
        {linkLabel}
      </a>
    </p>
  )
}

/** 폼 맨 아래 보조 안내 문구 */
export function AuthHint({ children }: { children: ReactNode }) {
  return <p className={styles.hint}>{children}</p>
}
