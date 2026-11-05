import { useState, type FormEvent } from 'react'
import { Dropzone } from '../../components/common'
import { Button, Icon, Modal, Sticker, TextArea, TextField } from '../../components/ui'
import { cx } from '../../lib/cx'
import type { PolicyDoc } from '../connection/types'
import styles from './CreateProjectModal.module.css'

export type NewProject = {
  name: string
  description: string
  /** 평가할 챗봇 서비스 주소 */
  endpointUrl: string
  systemPrompt: string
  policyDocs: PolicyDoc[]
}

type CreateProjectModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (project: NewProject) => void
}

/** 03 · 04 새 프로젝트: 1 서비스 연결 → 2 프롬프트 · 정책 문서 */
export function CreateProjectModal({ open, onClose, onSubmit }: CreateProjectModalProps) {
  // 열릴 때마다 새 폼이 만들어지도록 open일 때만 렌더링해서 이전 입력값이 남지 않게 함
  if (!open) return null
  return <CreateProjectForm onClose={onClose} onSubmit={onSubmit} />
}

const FORM_ID = 'create-project-form'
const STEPS = ['서비스 연결', '프롬프트 · 정책 문서']

/** URL이 아니어도 화면이 깨지지 않게 주소 부분만 꺼냄 */
export function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className={styles.stepper} aria-label="만들기 단계">
      {STEPS.map((label, i) => {
        const index = i + 1
        const state = index < step ? 'done' : index === step ? 'current' : 'todo'
        return (
          <li key={label} className={cx(styles.step, styles[state])} aria-current={state === 'current' ? 'step' : undefined}>
            <span className={styles.stepMarker} aria-hidden>
              {state === 'done' ? '✓' : index}
            </span>
            {label}
          </li>
        )
      })}
    </ol>
  )
}

function CreateProjectForm({ onClose, onSubmit }: Omit<CreateProjectModalProps, 'open'>) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [endpointUrl, setEndpointUrl] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [docs, setDocs] = useState<PolicyDoc[]>([])

  const stepOneDone = name.trim() !== '' && endpointUrl.trim() !== ''
  const stepTwoDone = systemPrompt.trim() !== ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 1) {
      if (stepOneDone) setStep(2)
      return
    }
    if (!stepTwoDone) return
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      endpointUrl: endpointUrl.trim(),
      systemPrompt: systemPrompt.trim(),
      policyDocs: docs,
    })
  }

  // TODO: 문서 업로드 API 연동 후 실제 청크 수로 교체. 지금은 처리 중(null)으로 추가
  const addDocs = (files: File[]) =>
    setDocs((prev) => [
      ...prev,
      ...files
        .filter((f) => !prev.some((d) => d.name === f.name))
        .map((f) => ({ id: `${f.name}-${f.lastModified}`, name: f.name, chunks: null })),
    ])

  return (
    <Modal
      open
      size="lg"
      title="새 프로젝트"
      onClose={onClose}
      subheader={<Stepper step={step} />}
      decoration={<Sticker name="paperclipLime" width={50} motion="sway" rot={34} className={styles.clip} />}
      secondaryAction={
        step === 2 && (
          <Button variant="tonal" size="xs" icon="arrowLeft" onClick={() => setStep(1)}>
            이전
          </Button>
        )
      }
      actions={
        <>
          {step === 1 && (
            <Button variant="tonal" size="xs" onClick={onClose}>
              취소
            </Button>
          )}
          {/* 버튼이 폼 바깥(모달 푸터)에 있어서 form 속성으로 연결 */}
          {step === 1 ? (
            <Button type="submit" size="xs" form={FORM_ID} iconEnd="arrowRight" disabled={!stepOneDone}>
              다음
            </Button>
          ) : (
            <Button type="submit" size="xs" form={FORM_ID} icon="checkDark" disabled={!stepTwoDone}>
              프로젝트 만들기
            </Button>
          )}
        </>
      }
    >
      <form id={FORM_ID} className={styles.form} onSubmit={handleSubmit} noValidate>
        {step === 1 ? (
          <>
            <TextField
              label="프로젝트 이름"
              name="name"
              autoComplete="off"
              placeholder="예: 모아몰 CS 챗봇"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <TextField
              label="설명 (선택)"
              name="description"
              autoComplete="off"
              placeholder="어떤 서비스를 평가하는지 적어두세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className={styles.service}>
              <span className={styles.serviceLabel}>
                <Icon name="server" />
                평가할 서비스
              </span>
              <input
                className={styles.serviceInput}
                name="endpointUrl"
                aria-label="평가할 서비스 주소"
                placeholder="https://cs-bot.example.com/v1/chat"
                autoComplete="off"
                spellCheck={false}
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
              />
              <span className={cx(styles.serviceState, endpointUrl.trim() && styles.serviceOn)} aria-hidden />
            </div>
            <p className={styles.note}>프로젝트 하나에 서비스 하나를 연결합니다. 인증 토큰 · 응답 경로는 프로젝트 설정에서 바꿀 수 있습니다.</p>
          </>
        ) : (
          <>
            <TextArea
              label="시스템 프롬프트"
              name="systemPrompt"
              className={styles.prompt}
              placeholder={'당신은 모아몰 고객센터 상담원입니다.\n검색된 문서 내용만 근거로 답하세요.'}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              autoFocus
            />
            <div className={styles.docs}>
              <span className={styles.docsLabel}>정책 문서</span>
              <Dropzone title="PDF를 끌어 놓거나 클릭해서 선택" accept=".pdf" multiple onFiles={addDocs} />
              {docs.length > 0 && (
                <ul className={styles.docList}>
                  {docs.map((doc) => (
                    <li key={doc.id} className={styles.doc}>
                      <Icon name="fileSm" />
                      <span className={styles.docName} title={doc.name}>
                        {doc.name}
                      </span>
                      <span className={styles.docMeta}>{doc.chunks == null ? '처리 중' : `청크 ${doc.chunks}`}</span>
                      <button
                        type="button"
                        className={styles.docRemove}
                        aria-label={`${doc.name} 빼기`}
                        onClick={() => setDocs((prev) => prev.filter((d) => d.id !== doc.id))}
                      >
                        <Icon name="xSm" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </form>
    </Modal>
  )
}
