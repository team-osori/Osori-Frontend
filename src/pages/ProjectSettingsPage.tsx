import { useState } from 'react'
import { Tabs } from '../components/ui'
import { DangerZone, EmptyState, PageHeader, ProjectInfoForm, ProjectSidebar, type ProjectInfo } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { stageRoute } from '../routes'
import { ConnectionTestCard } from '../features/connection/ConnectionTestCard'
import { PolicyDocsCard } from '../features/connection/PolicyDocsCard'
import { SystemPromptCard } from '../features/connection/SystemPromptCard'
import { testConnection } from '../features/connection/api'
import type { ConnectionTestResult } from '../features/connection/types'
import { EndpointCard } from '../features/connection/EndpointCard'
import { GradersCard } from '../features/connection/GradersCard'
import { GRADER_OPTIONS, MOCK_CONNECTION, MOCK_TEST_QUESTION } from '../features/connection/mock'
import { DeleteProjectModal } from '../features/settings/DeleteProjectModal'
import styles from './ProjectSettingsPage.module.css'

const user = { name: '김QA', role: '어드민' }

/** URL이 잘못 입력돼도 화면이 깨지지 않게 주소 부분만 꺼냄 */
function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

type Tab = 'general' | 'service' | 'prompt' | 'grader' | 'member'

type ProjectSettingsPageProps = {
  projectId?: string
  initialInfo?: ProjectInfo
  /** 진행 중인 평가 단계(1~3). 사이드바에 이 단계까지 열어 둠 */
  stage?: number
  onDeleted?: () => void
  onBack?: () => void
}

/** 프로젝트 설정 (일반 · 서비스 연결 · 프롬프트 · 문서 · 채점자 · 멤버) */
export default function ProjectSettingsPage({
  projectId = 'moamall-cs',
  initialInfo = { name: '모아몰 CS 챗봇', description: '주문·배송·환불 문의에 답하는 고객센터 챗봇을 평가합니다.' },
  stage = 2,
  onDeleted,
  onBack,
}: ProjectSettingsPageProps) {
  const [tab, setTab] = useState<Tab>('general')
  const [info, setInfo] = useState(initialInfo)
  const [connection, setConnection] = useState(MOCK_CONNECTION)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [savedAt, setSavedAt] = useState<string>()
  const [question, setQuestion] = useState(MOCK_TEST_QUESTION)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)
  const patchConnection = (patch: Partial<typeof connection>) => setConnection((c) => ({ ...c, ...patch }))

  const runTest = async () => {
    setTesting(true)
    try {
      setTestResult(await testConnection(connection, question))
    } finally {
      setTesting(false)
    }
  }

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          user={user}
          projectName={info.name}
          promptOptions={[{ value: 'v3', label: 'v3 (최신)' }]}
          promptValue="v3"
          onPromptChange={() => {}}
          host={hostOf(connection.endpointUrl)}
          questionSet="v1 · 67문항"
          current={stageRoute(stage)}
          unlockedUntil={stage}
          settingsActive
          onBack={onBack}
        />
      }
    >
      <div className={styles.page}>
        <PageHeader title="프로젝트 설정" />
        <Tabs
          ariaLabel="프로젝트 설정"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'general', label: '일반' },
            { value: 'service', label: '서비스 연결' },
            { value: 'prompt', label: '프롬프트 · 문서' },
            { value: 'grader', label: '채점자' },
            { value: 'member', label: '멤버' },
          ]}
        />

        <div className={styles.panel} role="tabpanel">
          {tab === 'general' && (
            <>
              <ProjectInfoForm
                projectId={projectId}
                initialValue={info}
                serviceLabel={`${connection.serviceName} · ${hostOf(connection.endpointUrl)}`}
                onChangeService={() => setTab('service')}
                onSubmit={(_, value) => {
                  setInfo(value)
                  setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
                }}
              />
              {savedAt && (
                <p className={styles.saved} role="status">
                  {savedAt}에 저장했습니다.
                </p>
              )}
              <DangerZone onAction={() => setDeleteOpen(true)} />
            </>
          )}
          {tab === 'service' && (
            <>
              <EndpointCard value={connection} onChange={patchConnection} />
              <ConnectionTestCard
                question={question}
                onQuestionChange={setQuestion}
                onTest={runTest}
                testing={testing}
                result={testResult}
              />
            </>
          )}
          {tab === 'prompt' && (
            <>
              <SystemPromptCard
                version={connection.promptVersion}
                value={connection.systemPrompt}
                onChange={(systemPrompt) => patchConnection({ systemPrompt })}
              />
              <PolicyDocsCard
                docs={connection.policyDocs}
                onAdd={(files) =>
                  patchConnection({
                    policyDocs: [
                      ...connection.policyDocs,
                      ...files.map((file) => ({ id: `${file.name}-${file.lastModified}`, name: file.name, chunks: null })),
                    ],
                  })
                }
              />
            </>
          )}
          {tab === 'grader' && (
            <GradersCard
              options={GRADER_OPTIONS}
              graderA={connection.graderA}
              graderB={connection.graderB}
              onChange={patchConnection}
            />
          )}
          {tab === 'member' && (
            <EmptyState icon="grid" title="멤버 관리는 준비 중입니다" description="프로젝트에 함께할 사람을 초대하는 기능이 곧 추가됩니다." />
          )}
        </div>
      </div>

      <DeleteProjectModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        projectName={info.name}
        promptVersionCount={3}
        questionSetCount={1}
        onConfirm={() => {
          setDeleteOpen(false)
          onDeleted?.()
        }}
      />
    </AppLayout>
  )
}
