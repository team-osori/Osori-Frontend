import { useState, type FormEvent } from 'react'
import { Dropzone } from '../../components/common'
import { Button, Icon, Modal, Sticker, TextArea, TextField } from '../../components/ui'
import { cx } from '../../lib/cx'
import type { PolicyDoc } from '../connection/types'
import styles from './CreateProjectModal.module.css'

export type NewProject = {
  name: string
  description: string
  /** 답변을 만들 AI API 키 (OpenAI 기준) */
  aiApiKey: string
  /** 정책 문서를 검색할 RAG 서비스 주소 */
  ragEndpoint: string
  /** RAG 서비스 인증키 (선택) */
  ragAuthKey: string
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
  const [aiApiKey, setAiApiKey] = useState('')
  const [ragEndpoint, setRagEndpoint] = useState('')
  const [ragAuthKey, setRagAuthKey] = useState('')
  // 평가할 서비스: ▼를 누르면 아래로 연결 정보 입력칸이 펼쳐짐
  const [serviceOpen, setServiceOpen] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [docs, setDocs] = useState<PolicyDoc[]>([])

  const stepOneDone = name.trim() !== '' && aiApiKey.trim() !== '' && ragEndpoint.trim() !== ''
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
      aiApiKey: aiApiKey.trim(),
      ragEndpoint: ragEndpoint.trim(),
      ragAuthKey: ragAuthKey.trim(),
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
      size="xl"
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
            <div className={cx(styles.service, serviceOpen && styles.serviceOpen)}>
              <button
                type="button"
                className={styles.serviceHead}
                aria-expanded={serviceOpen}
                aria-controls="create-project-service"
                onClick={() => setServiceOpen((v) => !v)}
              >
                <span className={styles.serviceLabel}>
                  <Icon name="server" />
                  평가할 서비스
                </span>
                <span className={cx(styles.serviceHost, !ragEndpoint.trim() && styles.serviceHostEmpty)}>
                  {ragEndpoint.trim() ? hostOf(ragEndpoint.trim()) : 'AI 키 · RAG 주소를 입력하세요'}
                </span>
                <span className={styles.caret} aria-hidden />
              </button>
              {/* 닫혀 있어도 입력값은 유지. 닫히면 칸이 접혀서 포커스도 안 감 */}
              <div id="create-project-service" className={styles.serviceBody} inert={!serviceOpen}>
                <div className={styles.serviceFields}>
                  <TextField
                    label="AI API 키 (OpenAI)"
                    name="aiApiKey"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="sk-..."
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                  />
                  <div className={styles.serviceRow}>
                    <TextField
                      label="RAG 엔드포인트"
                      name="ragEndpoint"
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="https://rag.example.com/v1/search"
                      value={ragEndpoint}
                      onChange={(e) => setRagEndpoint(e.target.value)}
                    />
                    <TextField
                      label="RAG 인증키"
                      name="ragAuthKey"
                      type="password"
                      autoComplete="off"
                      placeholder="인증키 (선택)"
                      value={ragAuthKey}
                      onChange={(e) => setRagAuthKey(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
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
