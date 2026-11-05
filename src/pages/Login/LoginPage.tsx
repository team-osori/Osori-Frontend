import { useState, type FormEvent } from 'react'
import { AuthBrandPanel } from '../../components/common'
import { Button, TextField } from '../../components/ui'
import styles from './LoginPage.module.css'

/** 01 로그인 — 좌측 브랜드 패널 + 우측 로그인 폼 */
export function LoginPage({ onLogin }: { onLogin?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO: 인증 API 연동. 지금은 입력값과 무관하게 다음 화면으로 이동
    onLogin?.()
  }

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <AuthBrandPanel connected />
      </div>

      <div className={styles.formSide}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <header className={styles.header}>
            <h1 className={styles.title}>로그인</h1>
            <p className={styles.subtitle}>팀 계정으로 로그인하세요.</p>
          </header>

          <div className={styles.fields}>
            <TextField
              label="이메일"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="비밀번호"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className={styles.submit}>
            로그인
          </Button>

          <p className={styles.signup}>
            계정이 없으신가요?{' '}
            <a className={styles.signupLink} href="/signup">
              회원가입
            </a>
          </p>

          <p className={styles.hint}>비밀번호를 잊으셨나요? 인스턴스 관리자에게 문의하세요.</p>
        </form>
      </div>
    </div>
  )
}
