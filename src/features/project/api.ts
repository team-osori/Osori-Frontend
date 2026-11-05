import { api, isValidId, pathId, revisionTag, type Page, type PageQuery, type RequestExtras, type Schema } from '../../lib/api'
import type { Project } from '../../types/project'

/** 서버가 내려주는 프로젝트 (openapi 스키마에서 생성한 타입) */
export type ProjectResponse = Schema<'ProjectResponse'>
export type ProjectCreateInput = { name: string; description?: string | null }
export type ProjectUpdateInput = { name?: string; description?: string | null }

/** 서버 입력 규칙. 서버가 거절하기 전에 화면에서 먼저 걸러낼 때 씁니다. */
export const PROJECT_RULES = {
  nameMax: 50,
  descriptionMax: 2000,
} as const

/** 한 번에 받아 올 프로젝트 수 (서버 최대 100) */
export const PROJECT_PAGE_SIZE = 20

export const isValidProjectId = isValidId

/** 경로에 ID를 넣기 전에 검사해서, 잘못된 값이 엉뚱한 주소로 요청되는 일을 막음 */
const projectPath = (projectId: string) => `/api/projects/${pathId(projectId, '프로젝트 ID')}`

/** 내 프로젝트 한 페이지. 다음 페이지는 응답의 nextCursor를 cursor로 넘깁니다. */
export function listProjects(query: PageQuery & RequestExtras = {}): Promise<Page<ProjectResponse>> {
  const { signal, limit = PROJECT_PAGE_SIZE, cursor } = query
  return api.get<Page<ProjectResponse>>('/api/projects', { query: { limit, cursor }, signal })
}

/**
 * 프로젝트 만들기. 이름 앞뒤 공백을 지우고, 비어 있는 설명은 보내지 않습니다.
 * 같은 요청이 두 번 만들어지지 않도록 호출하는 쪽에서 버튼을 잠가야 합니다(useApiMutation의 pending).
 */
export function createProject(input: ProjectCreateInput, extras: RequestExtras = {}): Promise<ProjectResponse> {
  const name = input.name.trim()
  const description = input.description?.trim()
  return api.post<ProjectResponse>(
    '/api/projects',
    { name, ...(description ? { description } : {}) },
    { signal: extras.signal },
  )
}

export function getProject(projectId: string, extras: RequestExtras = {}): Promise<ProjectResponse> {
  return api.get<ProjectResponse>(projectPath(projectId), { signal: extras.signal })
}

/**
 * 프로젝트 이름 · 설명 수정. 마지막으로 본 revision을 보내고, 그 사이 다른 사람이 고쳤으면 409로 거절됩니다.
 * 비운 설명은 null로 보내 지웁니다.
 */
export function updateProject(projectId: string, revision: number, input: ProjectUpdateInput, extras: RequestExtras = {}) {
  const body: Record<string, unknown> = { expectedRevision: revision }
  if (input.name !== undefined) body.name = input.name.trim()
  if (input.description !== undefined) body.description = input.description?.trim() || null
  return api.patch<ProjectResponse>(projectPath(projectId), body, { signal: extras.signal })
}

/** 프로젝트를 휴지통으로 옮깁니다. revision을 If-Match로 보냅니다(어드민만 가능). */
export function deleteProject(projectId: string, revision: number, extras: RequestExtras = {}) {
  return api.delete(projectPath(projectId), { ifMatch: revisionTag(revision), signal: extras.signal })
}

/* ---------- 서버 응답 -> 화면용 Project ---------- */

const STATUS: Record<NonNullable<ProjectResponse['progress']>['status'], Project['status']> = {
  SETUP: 'setup',
  RUNNING: 'running',
  DONE: 'done',
}

/** 서버 시각(ISO)을 목록 표기(YYYY-MM-DD HH:mm, 이 기기 시간대)로 */
function formatDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * 서버 응답을 화면이 쓰는 Project로 바꿉니다.
 *
 * 진행 상태 · 단계 · 마지막 평가는 서버의 progress를 씁니다. 서버에 없는 값(서비스 주소 · 점수)은 지어내지 않고
 * "아직 모름"으로 둡니다. 주소는 빈 문자열, 점수는 null이라 화면에는 `—`로 보입니다.
 * 서비스 주소는 서비스 연결 설정(connection.url)에 있지만 목록 한 줄마다 요청하면 비용이 커서 여기서 채우지 않습니다.
 */
export function toProject(response: ProjectResponse): Project {
  const progress = response.progress
  return {
    id: response.id,
    name: response.name,
    description: response.description ?? undefined,
    host: '',
    status: progress ? STATUS[progress.status] : 'setup',
    scores: { retrieval: null, grounding: null, response: null, policy: null },
    lastEvaluatedAt: progress?.lastEvaluatedAt ? formatDateTime(progress.lastEvaluatedAt) : null,
    promptVersion: progress?.promptVersion ?? null,
    currentStep: progress?.stage ?? 1,
  }
}
