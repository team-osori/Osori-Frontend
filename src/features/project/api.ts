import { api, isValidId, pathId, type Page, type PageQuery, type RequestExtras, type Schema } from '../../lib/api'
import type { Project } from '../../types/project'

/** 서버가 내려주는 프로젝트 (openapi 스키마에서 생성한 타입) */
export type ProjectResponse = Schema<'ProjectResponse'>
export type ProjectCreateInput = { name: string; description?: string | null }

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

/* ---------- 서버 응답 -> 화면용 Project ---------- */

/**
 * 서버 응답을 화면이 쓰는 Project로 바꿉니다.
 *
 * 서버가 주는 값(id · 이름 · 설명)만 실제 값을 쓰고, 서버에 없는 값(점수 · 마지막 평가 시각 · 진행 단계)은
 * 지어내지 않고 "아직 모름"으로 둡니다. 화면은 점수를 `—`로 보여줍니다. (필요한 API는 #26에 정리돼 있음)
 *
 * 상태는 서버 정보로 확실한 것만 판단합니다. 연결한 서비스가 없으면 아직 설정 전(setup)이 분명하지만,
 * 서비스가 있다고 해서 평가가 끝났는지는 프로젝트 응답만으로 알 수 없어서 평가 목록 API가 생기기 전까지 setup으로 둡니다.
 */
export function toProject(response: ProjectResponse): Project {
  return {
    id: response.id,
    name: response.name,
    description: response.description ?? undefined,
    status: 'setup',
    scores: { retrieval: null, grounding: null, response: null, policy: null },
    lastEvaluatedAt: null,
    promptVersion: null,
    progressText: response.serviceCount > 0 ? '서비스 연결됨' : '1 · 연결 설정',
    currentStep: 1,
  }
}
