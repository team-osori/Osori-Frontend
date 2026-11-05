import { useState } from 'react'
import { Tabs, useToast } from '../components/ui'
import { DangerZone, EmptyState, ErrorNotice, PageHeader, ProjectInfoForm, ProjectSidebar, useProjectNav } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { errorMessage, isApiError, useApiQuery } from '../lib/api'
import { stageRoute } from '../routes'
import { ConnectionTestCard } from '../features/connection/ConnectionTestCard'
import { EndpointCard } from '../features/connection/EndpointCard'
import { GradersCard } from '../features/connection/GradersCard'
import { PolicyDocsCard } from '../features/connection/PolicyDocsCard'
import { SystemPromptCard } from '../features/connection/SystemPromptCard'
import { putLlmSecret, putSecret, saveConnection, type ConnectionResponse } from '../features/connection/connectionApi'
import { DEFAULT_ENDPOINT_FORM, fromConnection, toConnectionInput, validateEndpointForm, type EndpointForm } from '../features/connection/connectionForm'
import { useConnection, useConnectionTest } from '../features/connection/useConnection'
import type { PolicyDoc } from '../features/connection/types'
import { uploadPolicyFile, usePolicies } from '../features/policy'
import { DEFAULT_PROMPT_NAME, deleteProject, getProject, updateProject } from '../features/project'
import { createPrompt, createPromptVersion, getPrompt, usePrompts, type Prompt } from '../features/prompt'
import { createService, updateService, useProjectService, type ServiceResponse } from '../features/service'
import { DeleteProjectModal } from '../features/settings/DeleteProjectModal'
import styles from './ProjectSettingsPage.module.css'

/** 채점 모델은 아직 API가 없어 화면에서만 고릅니다. */
const GRADER_OPTIONS = [
  { value: 'model-a', label: '채점 모델 A' },
  { value: 'model-b', label: '채점 모델 B' },
  { value: 'model-c', label: '채점 모델 C' },
]

const TEST_QUESTION = '주문 취소는 어디서 하나요?'

/** URL이 잘못 입력돼도 화면이 깨지지 않게 주소 부분만 꺼냄 */
function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

const today = (iso: string) => iso.slice(0, 10)

type Tab = 'general' | 'service' | 'prompt' | 'grader' | 'member'

type ProjectSettingsPageProps = {
  projectId: string
  /** 진행 중인 평가 단계(1~3). 사이드바에 이 단계까지 열어 둠 */
  stage?: number
  /** 이름 · 설명을 바꾸면 프로젝트 목록을 다시 불러오도록 알림 */
  onProjectChange?: () => void
  onDeleted?: () => void
  onBack?: () => void
}

/** 프로젝트 설정 (일반 · 서비스 연결 · 프롬프트 · 문서 · 채점자 · 멤버) */
export default function ProjectSettingsPage({ projectId, stage = 1, onProjectChange, onDeleted, onBack }: ProjectSettingsPageProps) {
  const toast = useToast()
  // 서비스 연결 · 프롬프트 · 이름을 바꾸면 사이드바 요약도 다시 불러옴
  const refreshSummary = useProjectNav()?.current?.reload ?? (() => {})
  const [tab, setTab] = useState<Tab>('general')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [savedAt, setSavedAt] = useState<string>()

  const project = useApiQuery((signal) => getProject(projectId, { signal }), [projectId])
  const { service, ...serviceQuery } = useProjectService(projectId)
  const serviceId = service?.id
  const connection = useConnection(projectId, serviceId)
  // 서비스마다 시스템 프롬프트는 하나만 씁니다(새 프로젝트를 만들 때 하나 생김). 여러 개면 가장 최근 것을 씀
  const prompts = usePrompts(projectId, serviceId)
  const promptId = prompts.items[0]?.id
  const prompt = useApiQuery<Prompt | null>(
    (signal) => (serviceId && promptId ? getPrompt(projectId, serviceId, promptId, { signal }) : Promise.resolve(null)),
    [projectId, serviceId, promptId],
  )

  if (project.error && !project.data) {
    return (
      <AppLayout
        sidebar={<ProjectSidebar projectName="프로젝트" promptValue="" onPromptChange={() => {}} questionSet="—" settingsActive onBack={onBack} />}
      >
        <div className={styles.page}>
          <PageHeader title="프로젝트 설정" />
          <ErrorNotice error={project.error} title="프로젝트를 불러오지 못했습니다" onRetry={project.reload} />
        </div>
      </AppLayout>
    )
  }
  if (!project.data) return null
  const info = project.data

  const host = connection.connection ? hostOf(connection.connection.url) : undefined
  const promptVersion = prompt.data?.currentVersion.version
  const testSet = info.progress?.testSet

  async function saveInfo(value: { name: string; description: string }) {
    try {
      const updated = await updateProject(projectId, info.revision, { name: value.name, description: value.description })
      project.setData(updated)
      onProjectChange?.()
      refreshSummary()
      setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
    } catch (error) {
      if (isApiError(error) && (error.status === 409 || error.status === 412)) project.reload()
      toast.error(errorMessage(error, '프로젝트 정보를 저장하지 못했습니다.'))
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      await deleteProject(projectId, info.revision)
      setDeleteOpen(false)
      toast.success(`${info.name} 프로젝트를 휴지통으로 옮겼습니다.`)
      onDeleted?.()
    } catch (error) {
      toast.error(errorMessage(error, '프로젝트를 삭제하지 못했습니다.'))
    } finally {
      setDeleting(false)
    }
  }

  // 처음 불러올 때만 비워 둠. 저장 · 테스트 뒤 다시 불러올 때 탭을 지우면 입력값과 테스트 결과가 사라짐
  const loadingService = service === undefined || (Boolean(serviceId) && !connection.loaded)

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          projectName={info.name}
          promptOptions={promptVersion !== undefined ? [{ value: 'current', label: `v${promptVersion} (최신)` }] : []}
          promptValue="current"
          onPromptChange={() => {}}
          host={host}
          questionSet={testSet ? `${testSet.label} · ${testSet.questionCount}문항` : '없음'}
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
                initialValue={{ name: info.name, description: info.description ?? '' }}
                serviceLabel={service ? `${service.name}${host ? ` · ${host}` : ''}` : '연결된 서비스 없음'}
                serviceConnected={Boolean(connection.connection)}
                onChangeService={() => setTab('service')}
                onSubmit={(_, value) => saveInfo(value)}
              />
              {savedAt && (
                <p className={styles.saved} role="status">
                  {savedAt}에 저장했습니다.
                </p>
              )}
              <DangerZone onAction={() => setDeleteOpen(true)} />
            </>
          )}
          {tab === 'service' &&
            (serviceQuery.error || connection.error ? (
              <ErrorNotice
                error={serviceQuery.error ?? connection.error}
                title="서비스 연결을 불러오지 못했습니다"
                onRetry={() => {
                  serviceQuery.reload()
                  connection.reload()
                }}
              />
            ) : loadingService ? null : (
              <ServiceTab
                // 저장해서 revision이 바뀌면 서버 값으로 입력칸을 다시 채움
                key={`${serviceId ?? 'new'}-${connection.connection?.revision ?? 0}`}
                projectId={projectId}
                defaultServiceName={info.name}
                service={service ?? null}
                connection={connection.connection}
                verified={connection.connection ? connection.verified : undefined}
                promptVersionId={prompt.data?.currentVersionId}
                onSaved={() => {
                  serviceQuery.reload()
                  connection.reload()
                  refreshSummary()
                }}
                onTested={connection.reload}
              />
            ))}
          {tab === 'prompt' && (
            <>
              {prompt.error || prompts.error ? (
                <ErrorNotice error={prompt.error ?? prompts.error} title="시스템 프롬프트를 불러오지 못했습니다" onRetry={prompts.reload} />
              ) : prompts.loading || prompt.loading ? null : (
                <PromptSection
                  key={prompt.data?.currentVersionId ?? 'new'}
                  projectId={projectId}
                  serviceId={serviceId}
                  prompt={prompt.data ?? null}
                  onSaved={() => {
                    prompts.reload()
                    prompt.reload()
                    refreshSummary()
                  }}
                />
              )}
              <PolicySection projectId={projectId} />
            </>
          )}
          {tab === 'grader' && <GraderSection />}
          {tab === 'member' && (
            <EmptyState icon="grid" title="멤버 관리는 준비 중입니다" description="프로젝트에 함께할 사람을 초대하는 기능이 곧 추가됩니다." />
          )}
        </div>
      </div>

      <DeleteProjectModal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        projectName={info.name}
        promptVersionCount={promptVersion ?? 0}
        questionSetCount={testSet ? 1 : 0}
        onConfirm={remove}
      />
    </AppLayout>
  )
}

/* ---------- 서비스 연결 탭 ---------- */

type ServiceTabProps = {
  projectId: string
  /** 서비스가 아직 없을 때 이름 칸의 처음 값 */
  defaultServiceName: string
  service: ServiceResponse | null
  connection: ConnectionResponse | null
  verified?: boolean
  /** 연결 테스트 때 함께 보낼 프롬프트 버전 */
  promptVersionId?: string
  onSaved: () => void
  onTested: () => void
}

function ServiceTab({ projectId, defaultServiceName, service, connection, verified, promptVersionId, onSaved, onTested }: ServiceTabProps) {
  const toast = useToast()
  const initialForm = connection ? fromConnection(connection) : DEFAULT_ENDPOINT_FORM
  const initialName = service?.name ?? defaultServiceName
  const [serviceName, setServiceName] = useState(initialName)
  const [form, setForm] = useState<EndpointForm>(initialForm)
  const [errors, setErrors] = useState<ReturnType<typeof validateEndpointForm> & { serviceName?: string }>({})
  const [saving, setSaving] = useState(false)
  const [question, setQuestion] = useState(TEST_QUESTION)
  const test = useConnectionTest(projectId, service?.id)

  const dirty =
    !connection || serviceName !== initialName || (Object.keys(form) as (keyof EndpointForm)[]).some((key) => form[key] !== initialForm[key])

  async function save() {
    const found = { ...validateEndpointForm(form), ...(serviceName.trim() ? {} : { serviceName: '서비스 이름을 입력해 주세요.' }) }
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      let target = service
      if (!target) target = await createService(projectId, { name: serviceName })
      else if (serviceName.trim() !== target.name) target = await updateService(projectId, target.id, target.revision, { name: serviceName })

      const saved = await saveConnection(projectId, target.id, toConnectionInput(form, connection), connection?.revision ?? null)
      // 키를 저장할 때마다 revision이 올라가서 직전 응답의 revision을 다음 요청에 씀
      let revision = saved.revision
      if (form.authKey.trim()) revision = (await putSecret(projectId, target.id, form.authKey.trim(), revision)).revision
      if (form.aiKey.trim()) await putLlmSecret(projectId, target.id, form.aiKey.trim(), revision)
      toast.success('서비스 연결을 저장했습니다. 연결 테스트로 확인해 주세요.')
      onSaved()
    } catch (error) {
      // 다른 사람이 먼저 고쳤으면 최신 값을 다시 불러옴
      if (isApiError(error) && (error.status === 409 || error.status === 412)) onSaved()
      const fields = isApiError(error) ? error.fieldMessages() : {}
      if (Object.keys(fields).length > 0) setErrors((prev) => ({ ...prev, ...fields }))
      toast.error(errorMessage(error, '서비스 연결을 저장하지 못했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  async function runTest() {
    if (!connection) return
    const result = await test.run({ connectionRevision: connection.revision, question: question.trim(), promptVersionId })
    // 성공하면 서버가 verifiedRevision을 기록하므로 다시 읽음
    if (result?.status === 'SUCCEEDED') onTested()
  }

  return (
    <>
      <EndpointCard
        serviceName={serviceName}
        onServiceNameChange={setServiceName}
        value={form}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        errors={errors}
        secretConfigured={Boolean(connection?.auth.secretConfigured)}
        aiKeyConfigured={Boolean(connection?.llmKeyConfigured)}
        verified={verified}
        dirty={dirty}
        saving={saving}
        onSave={save}
      />
      <ConnectionTestCard
        question={question}
        onQuestionChange={setQuestion}
        onTest={runTest}
        testing={test.running}
        result={test.result}
        error={test.error}
        disabledReason={!connection ? '먼저 서비스 연결을 저장해 주세요.' : dirty ? '바꾼 설정을 먼저 저장해 주세요.' : undefined}
      />
    </>
  )
}

/* ---------- 프롬프트 · 문서 탭 ---------- */

type PromptSectionProps = {
  projectId: string
  serviceId?: string
  prompt: Prompt | null
  onSaved: () => void
}

function PromptSection({ projectId, serviceId, prompt, onSaved }: PromptSectionProps) {
  const toast = useToast()
  const initial = prompt?.currentVersion.content ?? ''
  const [content, setContent] = useState(initial)
  const [saving, setSaving] = useState(false)

  if (!serviceId) {
    return <EmptyState icon="server" title="서비스 연결을 먼저 저장해 주세요" description="시스템 프롬프트는 연결한 서비스마다 저장합니다." />
  }

  async function save() {
    if (!serviceId) return
    setSaving(true)
    try {
      if (prompt) await createPromptVersion(projectId, serviceId, prompt.id, { content, baseVersionId: prompt.currentVersionId })
      else await createPrompt(projectId, serviceId, { name: DEFAULT_PROMPT_NAME, content })
      toast.success('시스템 프롬프트를 저장했습니다.')
      onSaved()
    } catch (error) {
      // 그 사이 다른 버전이 생겼으면 최신 버전을 다시 불러옴
      if (isApiError(error) && error.code === 'PROMPT_VERSION_CONFLICT') onSaved()
      toast.error(errorMessage(error, '시스템 프롬프트를 저장하지 못했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SystemPromptCard
      version={prompt?.currentVersion.version}
      value={content}
      onChange={setContent}
      dirty={content !== initial}
      saving={saving}
      onSave={save}
    />
  )
}

function PolicySection({ projectId }: { projectId: string }) {
  const toast = useToast()
  const policies = usePolicies(projectId)
  const [uploading, setUploading] = useState<string[]>([])

  async function add(files: File[]) {
    setUploading(files.map((file) => file.name))
    let saved = 0
    // 서버가 문서를 읽는 데 시간이 걸려 한 번에 하나씩 올림
    for (const file of files) {
      try {
        await uploadPolicyFile(projectId, file)
        saved += 1
      } catch (error) {
        toast.error(`${file.name}: ${errorMessage(error, '올리지 못했습니다.')}`)
      } finally {
        setUploading((prev) => prev.filter((name) => name !== file.name))
      }
    }
    if (saved > 0) {
      toast.success(`정책 문서 ${saved}개를 저장했습니다.`)
      policies.reload()
    }
  }

  if (policies.error) return <ErrorNotice error={policies.error} title="정책 문서를 불러오지 못했습니다" onRetry={policies.reload} />

  const docs: PolicyDoc[] = [
    ...uploading.map((name) => ({ id: `uploading-${name}`, name, meta: '올리는 중' })),
    ...policies.items.map((policy) => ({ id: policy.id, name: policy.name, meta: `${today(policy.createdAt)} 추가` })),
  ]
  return <PolicyDocsCard docs={docs} onAdd={add} uploading={uploading.length > 0} />
}

/* ---------- 채점자 탭 (API 없음) ---------- */

function GraderSection() {
  const [graders, setGraders] = useState({ graderA: 'model-a', graderB: 'model-b' })
  return (
    <GradersCard
      options={GRADER_OPTIONS}
      graderA={graders.graderA}
      graderB={graders.graderB}
      onChange={(patch) => setGraders((prev) => ({ ...prev, ...patch }))}
    />
  )
}

