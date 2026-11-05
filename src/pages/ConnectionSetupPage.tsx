import { useState } from 'react'
import { Button } from '../components/ui'
import { ActionBar, PageHeader, ProjectSidebar } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { testConnection } from '../features/connection/api'
import { GRADER_OPTIONS, MOCK_CONNECTION, MOCK_TEST_QUESTION, MOCK_TEST_RESULT } from '../features/connection/mock'
import type { ConnectionConfig, ConnectionTestResult } from '../features/connection/types'
import { EndpointCard } from '../features/connection/EndpointCard'
import { SystemPromptCard } from '../features/connection/SystemPromptCard'
import { PolicyDocsCard } from '../features/connection/PolicyDocsCard'
import { ConnectionTestCard } from '../features/connection/ConnectionTestCard'
import { GradersCard } from '../features/connection/GradersCard'
import styles from './ConnectionSetupPage.module.css'

const user = { name: '김QA', role: '어드민' }

/** 다음 단계로 넘어가려면 채워야 하는 항목 */
const REQUIRED: Array<{ key: keyof ConnectionConfig; label: string }> = [
  { key: 'serviceName', label: '서비스 이름' },
  { key: 'endpointUrl', label: '엔드포인트 URL' },
  { key: 'responsePath', label: '응답 경로' },
  { key: 'systemPrompt', label: '시스템 프롬프트' },
]

type ConnectionSetupPageProps = {
  projectName?: string
  initialConfig?: ConnectionConfig
  /** 저장 후 2단계(질문 세트)로 이동 */
  onSaveAndNext?: (config: ConnectionConfig) => void
  onBack?: () => void
}

/** 평가 1단계 · 연결 설정 */
export default function ConnectionSetupPage({
  projectName = '모아몰 CS 챗봇',
  initialConfig = MOCK_CONNECTION,
  onSaveAndNext,
  onBack,
}: ConnectionSetupPageProps) {
  const [config, setConfig] = useState(initialConfig)
  const [question, setQuestion] = useState(MOCK_TEST_QUESTION)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(MOCK_TEST_RESULT)

  const update = (patch: Partial<ConnectionConfig>) => setConfig((prev) => ({ ...prev, ...patch }))

  const filled = REQUIRED.filter(({ key }) => String(config[key]).trim() !== '').length
  const complete = filled === REQUIRED.length

  const runTest = async () => {
    setTesting(true)
    try {
      setTestResult(await testConnection(config, question))
    } finally {
      setTesting(false)
    }
  }

  const addDocs = (files: File[]) => {
    update({
      policyDocs: [
        ...config.policyDocs,
        ...files.map((file) => ({ id: `${file.name}-${file.lastModified}`, name: file.name, chunks: null })),
      ],
    })
  }

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          user={user}
          projectName={projectName}
          promptOptions={[{ value: config.promptVersion, label: config.promptVersion }]}
          promptValue={config.promptVersion}
          onPromptChange={() => {}}
          questionSet="없음"
          currentStep={1}
          onBack={onBack}
        />
      }
      footer={
        <ActionBar status={`필수 항목 ${filled} / ${REQUIRED.length} 완료`} tone={complete ? 'success' : 'neutral'}>
          <Button iconEnd="arrowRight" disabled={!complete} onClick={() => onSaveAndNext?.(config)}>
            저장하고 질문 세트로
          </Button>
        </ActionBar>
      }
    >
      <div className={styles.page}>
        <PageHeader title="연결 설정" />
        <div className={styles.grid}>
          <div className={styles.column}>
            <EndpointCard value={config} onChange={update} />
            <SystemPromptCard
              version={config.promptVersion}
              value={config.systemPrompt}
              onChange={(systemPrompt) => update({ systemPrompt })}
            />
            <PolicyDocsCard docs={config.policyDocs} onAdd={addDocs} />
          </div>
          <div className={styles.column}>
            <ConnectionTestCard
              question={question}
              onQuestionChange={setQuestion}
              onTest={runTest}
              testing={testing}
              result={testResult}
            />
            <GradersCard
              options={GRADER_OPTIONS}
              graderA={config.graderA}
              graderB={config.graderB}
              onChange={update}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
