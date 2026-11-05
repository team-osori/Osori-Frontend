import { useState } from 'react'
import { Tabs } from '../components/ui'
import { DangerZone, EmptyState, PageHeader, ProjectInfoForm, ProjectSidebar, type ProjectInfo } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { EndpointCard } from '../features/connection/EndpointCard'
import { GradersCard } from '../features/connection/GradersCard'
import { GRADER_OPTIONS, MOCK_CONNECTION } from '../features/connection/mock'
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

type Tab = 'general' | 'service' | 'grader' | 'member'

type ProjectSettingsPageProps = {
  projectId?: string
  initialInfo?: ProjectInfo
  /** 이미 끝난 단계까지 사이드바에 표시 */
  completedStep?: number
  onDeleted?: () => void
  onBack?: () => void
}

/** 프로젝트 설정 (일반 · 서비스 연결 · 채점자 · 멤버) */
export default function ProjectSettingsPage({
  projectId = 'moamall-cs',
  initialInfo = { name: '모아몰 CS 챗봇', description: '주문·배송·환불 문의에 답하는 고객센터 챗봇을 평가합니다.' },
  completedStep = 5,
  onDeleted,
  onBack,
}: ProjectSettingsPageProps) {
  const [tab, setTab] = useState<Tab>('general')
  const [info, setInfo] = useState(initialInfo)
  const [connection, setConnection] = useState(MOCK_CONNECTION)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [savedAt, setSavedAt] = useState<string>()

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          user={user}
          projectName={info.name}
          promptOptions={[{ value: 'v3', label: 'v3 (최신)' }]}
          promptValue="v3"
          onPromptChange={() => {}}
          questionSet="v1 · 67문항"
          currentStep={completedStep + 1}
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
            <EndpointCard value={connection} onChange={(patch) => setConnection((c) => ({ ...c, ...patch }))} />
          )}
          {tab === 'grader' && (
            <GradersCard
              options={GRADER_OPTIONS}
              graderA={connection.graderA}
              graderB={connection.graderB}
              onChange={(patch) => setConnection((c) => ({ ...c, ...patch }))}
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
